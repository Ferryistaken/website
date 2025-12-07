---
layout: post
title: "Rust Networking for xv6"
date: "2025-12-05 10:59:13"
tags: [linux, os, hardware]
description: Writing the networking stack for xv6 in Rust
---

# Intro

In my [previous post]({% post_url 2025-11-26-rust-inside-xv6 %}) I explained how to compile and link Rust modules for the x86 target, showing how to print a simple message from rust to the xv6 console.

In this guide I will expand on the framework explained above, implementing interrupt-driven networking with a single TCP socket (similar to *BSD) in the xv6 kernel, fully written in Rust, using the Intel e1000 network card.

On top of this, this project is built on the [public xv6 source](https://github.com/mit-pdos/xv6-public) (instead of my school's private xv6 fork) meaning that I can show the [full repo](https://github.com/Ferryistaken/xv6-public).

I will then show this functionality by telling ChatGPT 5.1 what syscalls it has access to and making it write a userspace HTTP server.

# e1000 xv6 Driver layer

There are a lot of [great guides](https://xiayingp.gitbook.io/build_a_os/labs/lab-10-networking-part-1) explaining how the e1000 works and how to interface to it in xv6.

On a very basic level:
- You first **initialize** the card by sending it a series of numbers over PCI.
    - On the internet you'll find [very extensive docs](https://courses.cs.washington.edu/courses/cse451/16au/readings/e1000.pdf) explaining exactly what everything does, but ChatGPT does a good job at making it so that you don't have to read through function codes.
- When the e1000 NIC **receives** a packet, it writes it to a circular buffer and generates an interrupt
- When you want to **transmit** a packet, you write a packet to a separate circular buffer and set a flag.

The kernel should therefore map these buffers into memory and then use MMIO to read and write to the network card.

![ring_buffer](/assets/posts/xv6-networking/ring_buffer.png)
> *From the docs linked above*

How I chose to implement this was by having four main functions:

1. `e1000_init(void)`
    - Reads card, maps memory, sends codes to set the card in the right mode.
2. `e1000_tx(data, len)`
    - Given ethernet frames (and its length), write packets to the circular buffer.
3. `e1000_rx_poll(buf, len)`
    - Check the NIC RX ring, if we received a packet, read it into buf.
4. `e1000_intr(void)`
    - The interrupt handler, when we receive an interrupt, pass control to the Rust handler.

## Init e1000
```c
void
e1000_init(void)
{
  ioapicenable(IRQ_E1000, 0);
  uint bus = 0;
  uint slot = 3;

  uint bar0 = pci_config_read32(bus, slot, 0, 0x10);
  uint mmio_pa = bar0 & ~0xF;

  uint pa_page = mmio_pa & ~(PGSIZE - 1);
  void *va_page = (void*)P2V(pa_page);
  uint mmio_size = 0x4000; // 4 pages

  int perm = PTE_W | PTE_P;

  if(mappages(kpgdir, va_page, mmio_size, pa_page, perm) < 0){
    cprintf("e1000: mappages failed for mmio_pa=0x%x\n", mmio_pa);
    return;
  }

  // Reload CR3 so CPU picks up new mapping
  lcr3(V2P(kpgdir));

  e1000_regs = (volatile uint *)P2V(mmio_pa);
  cprintf("e1000: BAR0=0x%x mmio_pa=0x%x regs=%p\n", bar0, mmio_pa, e1000_regs);

  uint status = e1000_read_reg(E1000_STATUS);
  cprintf("e1000: status=0x%x\n", status);

  // Enable bus mastering + memory space on the PCI device
  uint cmd = pci_config_read32(bus, slot, 0, 0x04);
  ushort cmd_lo = cmd & 0xFFFF;

  // Bit 1 = Memory Space Enable, Bit 2 = Bus Master Enable
  cmd_lo |= 0x0002; // MSE
  cmd_lo |= 0x0004; // BME

  cmd = (cmd & 0xFFFF0000) | cmd_lo;
  pci_config_write32(bus, slot, 0, 0x04, cmd);

  cprintf("e1000: PCI CMD=0x%x\n", cmd_lo);

  // Init TX ring
  int i;
  for(i = 0; i < TX_RING_SIZE; i++){
    tx_ring[i].addr_lo = V2P(tx_bufs[i]);
    tx_ring[i].addr_hi = 0;
    tx_ring[i].length  = 0;
    tx_ring[i].cso     = 0;
    tx_ring[i].cmd     = E1000_TXD_CMD_RS | E1000_TXD_CMD_IFCS;
    tx_ring[i].status  = E1000_TXD_STAT_DD;  // mark free
    tx_ring[i].css     = 0;
    tx_ring[i].special = 0;
  }

  e1000_write_reg(E1000_TDBAL, V2P(tx_ring));
  e1000_write_reg(E1000_TDBAH, 0);
  e1000_write_reg(E1000_TDLEN, sizeof(tx_ring));
  e1000_write_reg(E1000_TDH, 0);
  e1000_write_reg(E1000_TDT, 0);
  tx_tail = 0;

  // Init RX ring
  for(i = 0; i < RX_RING_SIZE; i++){
    rx_ring[i].addr_lo = V2P(rx_bufs[i]);
    rx_ring[i].addr_hi = 0;
    rx_ring[i].length  = 0;
    rx_ring[i].csum    = 0;
    rx_ring[i].status  = 0;   // owned by NIC
    rx_ring[i].errors  = 0;
    rx_ring[i].special = 0;
  }

  e1000_write_reg(E1000_RDBAL, V2P(rx_ring));
  e1000_write_reg(E1000_RDBAH, 0);
  e1000_write_reg(E1000_RDLEN, sizeof(rx_ring));
  e1000_write_reg(E1000_RDH, 0);
  e1000_write_reg(E1000_RDT, RX_RING_SIZE - 1);
  rx_next = 0;

  // 5) Configure transmit control
  uint tctl = 0;
  tctl |= E1000_TCTL_EN;   // enable TX
  tctl |= E1000_TCTL_PSP;  // pad short packets
  tctl |= (0x10 << E1000_TCTL_CT_SHIFT);   // collision threshold ~16
  tctl |= (0x40 << E1000_TCTL_COLD_SHIFT); // collision distance ~64
  e1000_write_reg(E1000_TCTL, tctl);

  // 6) Configure inter-packet gap
  uint tipg = 0;
  tipg |= E1000_TIPG_IPGT;
  tipg |= (E1000_TIPG_IPGR1 << E1000_TIPG_IPGR1_SHIFT);
  tipg |= (E1000_TIPG_IPGR2 << E1000_TIPG_IPGR2_SHIFT);
  e1000_write_reg(E1000_TIPG, tipg);

  // 7) Configure receive control
  uint rctl = 0;
  rctl |= E1000_RCTL_EN;        // enable RX
  rctl |= E1000_RCTL_BAM;       // accept broadcast
  rctl |= E1000_RCTL_UPE;       // accept all unicast
  rctl |= E1000_RCTL_MPE;       // accept all multicast
  rctl |= E1000_RCTL_SZ_2048;   // 2K buffers
  rctl |= E1000_RCTL_SECRC;     // strip CRC
  e1000_write_reg(E1000_RCTL, rctl);

  e1000_write_reg(E1000_IMC, 0xffffffff);  // mask all
  (void)e1000_read_reg(E1000_ICR);         // clear pending
  e1000_write_reg(E1000_IMS,
                  E1000_IMS_RXT0 |   // RX timer / normal receive
                  E1000_IMS_RXO  |   // RX overrun (optional)
                  E1000_IMS_RXDMT0 | // RX desc low watermark
                  E1000_IMS_TXDW);   // TX descriptor write-back

  // debug: read back RCTL to confirm
  uint rctl_read = e1000_read_reg(E1000_RCTL);
  cprintf("e1000: RCTL=0x%x\n", rctl_read);

  (void)e1000_test_send;
  // e1000_test_send();  // optional

  cprintf("e1000: initialized\n");

  // Initialize Rust+smoltcp stack now that NIC is ready.
  rust_net_init();
}
```

## Transmit frame
```c
int
e1000_tx(const void *data, int len)
{
  if(len <= 0 || len > PKT_BUF_SIZE)
    return -1;

  int tdt = e1000_read_reg(E1000_TDT);
  struct e1000_tx_desc *d = &tx_ring[tdt];

  cprintf("e1000_tx: tdt=%d status=0x%x\n", tdt, d->status);

  if((d->status & E1000_TXD_STAT_DD) == 0){
    cprintf("e1000_tx: ring full at %d\n", tdt);
    return -1;
  }

  memmove(tx_bufs[tdt], data, len);

  d->length = len;
  d->status = 0;
  d->cmd = E1000_TXD_CMD_RS | E1000_TXD_CMD_EOP | E1000_TXD_CMD_IFCS;

  tdt = (tdt + 1) % TX_RING_SIZE;
  e1000_write_reg(E1000_TDT, tdt);

  cprintf("e1000_tx: queued len=%d new TDT=%d\n", len, tdt);
  return 0;
}
```

## Read frame
```c
int
e1000_rx_poll(uchar *buf, int maxlen)
{
  struct e1000_rx_desc *d = &rx_ring[rx_next];

  if((d->status & E1000_RXD_STAT_DD) == 0)
    return -1;

  int n = 0;

  if((d->status & E1000_RXD_STAT_EOP) == 0){
    cprintf("e1000: RX fragment, dropping (len=%d status=0x%x)\n",
                  d->length, d->status);
    // n stays 0 -> caller won't use this packet
    goto rearm;
  }

  n = d->length;
  if(n > maxlen)
    n = maxlen;

  memmove(buf, rx_bufs[rx_next], n);

rearm:
  d->status = 0;
  d->errors = 0;

  rx_next = (rx_next + 1) % RX_RING_SIZE;
  int rdt = (rx_next + RX_RING_SIZE - 1) % RX_RING_SIZE;
  e1000_write_reg(E1000_RDT, rdt);

  return n;
}
```

## Handle Interrupt
```c
void
e1000_intr(void)
{
  uint icr = e1000_read_reg(E1000_ICR);

  if(icr == 0)
    return;

  // RX-related interrupt?
  if(icr & (E1000_ICR_RXT0 | E1000_ICR_RXDMT0 | E1000_ICR_RXO)){
    // Let Rust+smoltcp pull packets with e1000_rx_poll() and handle them.
    cprintf("handling packet in rust\n");
    rust_net_poll();
  }

  if(icr & E1000_ICR_TXDW){
    cprintf("e1000: TXDW\n");
  }

  (void)e1000_debug_dump;
}
```

# OS Layer
## "Manual" Networking

I started the project by implementing my own TCP/IP stack, however I realized early on that it would have involved writing hundreds of lines of code handling every specific IP protocols that I wanted (ICMP, HTTP, just to name a few) by reading their spec and manually creating all the specific packets, and I have no interest in doing so right now, given that this is an OS-focused project.


```rust
/// Inside the interrupt handler
...
    match ethertype {
        0x0806 => {
            // ARP
            unsafe { puts_const(b"rust_net_rx: ARP frame\n\0") };
            arp_rx(payload, src, dst);
        }
        0x0800 => {
            // IPv4
            unsafe { puts_const(b"rust_net_rx: IPv4 frame\n\0") };
            ipv4_rx(payload, src, dst);
        }
        _ => {
            // unsupported ethertype, drop silently for now
        }
...

/// Example of a ~120loc function just to handle basic ARP packets.
/// Most of the funciton is just manually building the correct buffers.
fn arp_rx(payload: &[u8], src_mac: &[u8], _dst_mac: &[u8]) {
    // We assume Ethernet/IPv4 ARP, which is 28 bytes minimum.
    if payload.len() < 28 || src_mac.len() < 6 {
        return;
    }

    let htype = u16::from_be_bytes([payload[0], payload[1]]);
    let ptype = u16::from_be_bytes([payload[2], payload[3]]);
    let hlen  = payload[4];
    let plen  = payload[5];
    let oper  = u16::from_be_bytes([payload[6], payload[7]]);

    // Only handle Ethernet (1) + IPv4 (0x0800), MAC len 6, IP len 4
    if htype != 1 || ptype != 0x0800 || hlen != 6 || plen != 4 {
        return;
    }

    // Layout:
    // [ 8..14 ] sender hw
    // [14..18] sender IP
    // [18..24] target hw
    // [24..28] target IP
    let sha = &payload[8..14];   // sender MAC
    let spa = &payload[14..18];  // sender IP
    let tpa = &payload[24..28];  // target IP
...
```
> *Snippet of what the could would have looked like was I to implement everything by myself. Hopefully you can see how this isn't aligned with the scope of this project.*

## The smoltcp crate

After some research I came across [`smoltcp`](https://github.com/smoltcp-rs/smoltcp), a *"standalone, event-driven TCP/IP stack that is designed for bare-metal, real-time systems"*. Very importantly, this crate compiles with `no_std`, making it an excellent choice for xv6 development.

The simplicity of this crate is what drew me to it. A [`Device`](https://docs.rs/smoltcp/latest/smoltcp/phy/trait.Device.html) only needs to implement `receive`, `transmit`, and `capabilities`. With these three methods done (which are really only 2, since capabilities is just a way to describe the device's capabilities.), we basically have a fully functional TCP/IP stack. For my `xv6` e1000 driver, these implementations looked like:

```rust
impl Device for Xv6Device {
    type RxToken<'a> = Xv6RxToken<'a> where Self: 'a;
    type TxToken<'a> = Xv6TxToken<'a> where Self: 'a;

    fn capabilities(&self) -> DeviceCapabilities {
        let mut caps = DeviceCapabilities::default();
        caps.medium = Medium::Ethernet;
        caps.max_transmission_unit = MAX_FRAME_SIZE as usize;
        caps
    }

    fn receive(
        &mut self,
        _timestamp: Instant,
    ) -> Option<(Self::RxToken<'_>, Self::TxToken<'_>)> {
        unsafe { puts_const(b"rust: smoltcp receive() got frame\n\0"); }

        self.rx_len = 0;
        // ↓ C function
        let n = unsafe { e1000_rx_poll(self.rx_buf.as_mut_ptr(), MAX_FRAME_SIZE as c_int) };
        if n <= 0 {
            return None;
        }

        self.rx_len = n as usize;
        let rx = Xv6RxToken {
            buffer: &self.rx_buf[..self.rx_len],
        };
        let tx = Xv6TxToken {
            buffer: &mut self.tx_buf[..],
        };
        Some((rx, tx))
    }

    fn transmit(&mut self, _timestamp: Instant) -> Option<Self::TxToken<'_>> {
        unsafe { puts_const(b"rust: smoltcp transmit() called\n\0"); }
        Some(Xv6TxToken {
            buffer: &mut self.tx_buf[..],
        })
    }
}

struct Xv6Device {
    rx_buf: [u8; MAX_FRAME_SIZE],
    rx_len: usize,
    tx_buf: [u8; MAX_FRAME_SIZE],
}

impl Xv6Device {
    const fn new() -> Self {
        Self {
            rx_buf: [0; MAX_FRAME_SIZE],
            rx_len: 0,
            tx_buf: [0; MAX_FRAME_SIZE],
        }
    }
}

struct Xv6RxToken<'a> {
    buffer: &'a [u8],
}

struct Xv6TxToken<'a> {
    buffer: &'a mut [u8],
}

impl<'a> RxToken for Xv6RxToken<'a> {
    fn consume<R, F>(self, f: F) -> R
    where
        F: FnOnce(&[u8]) -> R,
    {
        f(self.buffer)
    }
}

impl<'a> TxToken for Xv6TxToken<'a> {
    fn consume<R, F>(self, len: usize, f: F) -> R
    where
        F: FnOnce(&mut [u8]) -> R,
    {
        let slice = &mut self.buffer[..len];
        let result = f(slice);

        unsafe {
            puts_const(b"rust: smoltcp TxToken::consume, sending frame\n\0");
            // ↓ C function
            e1000_tx(slice.as_ptr(), len as c_int);
        }

        result
    }
}

```

With this done, we have a working TCP/IP stack that we can use from the xv6 kernel, however the user still has no way to access these resources.

# OS Syscall Layer

To give the user access to networking resources, I chose to implement 4 syscalls:

- `int  net_listen(int port);`
    - Listen on TCP port `port`.
- `int  net_accept(void);`
    - Returns 1 if a connection is established, 0 if not yet, -1 on error.
- `int  net_recv(void *buf, int n);`
    - Returns bytes read, 0 if no data, -1 on error.
- `int net_send(void *buf, int n);`
    - Returns bytes sent, 0 if would-block, -1 on error.
- `int net_close(void);`
    - Close current connection.

## C Side

On the C side, these functions simply do argument parsing and pass the control to the Rust module:

```C
int
sys_net_listen(void)
{
  int port;
  if(argint(0, &port) < 0)
    return -1;
  if(port < 0 || port > 65535)
    return -1;
  return rust_net_listen(port);
}

// int net_accept(void);
// returns 1 if a connection is established, 0 if not yet, -1 on error
int
sys_net_accept(void)
{
  return rust_net_accept();
}

// int net_recv(void *buf, int len);
int
sys_net_recv(void)
{
  int len;
  char *buf;

  if(argptr(0, &buf, 0) < 0) // size checked below
    return -1;
  if(argint(1, &len) < 0)
    return -1;
  if(len < 0)
    return -1;

  return rust_net_recv(buf, len);
}

// int net_send(void *buf, int len);
int
sys_net_send(void)
{
  int len;
  char *buf;

  if(argptr(0, &buf, 0) < 0)
    return -1;
  if(argint(1, &len) < 0)
    return -1;
  if(len < 0)
    return -1;

  return rust_net_send(buf, len);
}

// int net_close(void);
int
sys_net_close(void)
{
  rust_net_close();
  return 0;
}
```

## Rust Side

The real logic is all implement in the safe Rust module. However, due to `smoltcp`, these syscall handlers are very light:

```rust
#[no_mangle]
pub extern "C" fn rust_net_listen(port: i32) -> i32 {
    unsafe {
        let sockets = match SOCKET_SET.as_mut() {
            Some(s) => s,
            None => return -1,
        };
        let handle = match TCP_HANDLE {
            Some(h) => h,
            None => return -1,
        };
        let socket = sockets.get_mut::<tcp::Socket>(handle);
        match socket.listen(port as u16) {
            Ok(()) => 0,
            Err(_) => -1,
        }
    }
}

#[no_mangle]
pub extern "C" fn rust_net_accept() -> i32 {
    unsafe {
        let sockets = match SOCKET_SET.as_mut() {
            Some(s) => s,
            None => return -1,
        };
        let handle = match TCP_HANDLE {
            Some(h) => h,
            None => return -1,
        };
        let socket = sockets.get_mut::<tcp::Socket>(handle);
        use smoltcp::socket::tcp::State;
        match socket.state() {
            State::Established => 1,
            State::Listen | State::SynReceived | State::SynSent => 0,
            _ => 0,
        }
    }
}

#[no_mangle]
pub extern "C" fn rust_net_recv(buf: *mut u8, len: i32) -> i32 {
    if buf.is_null() || len <= 0 {
        return -1;
    }
    unsafe {
        let sockets = match SOCKET_SET.as_mut() {
            Some(s) => s,
            None => return -1,
        };
        let handle = match TCP_HANDLE {
            Some(h) => h,
            None => return -1,
        };
        let socket = sockets.get_mut::<tcp::Socket>(handle);

        if !socket.may_recv() {
            return 0;
        }

        let max_len = len as usize;
        let mut out_n: i32 = 0;

        let res = socket.recv(|data| {
            let n = core::cmp::min(data.len(), max_len);
            if n > 0 {
                core::ptr::copy_nonoverlapping(data.as_ptr(), buf, n);
            }
            out_n = n as i32;
            // consume n bytes, return n as the closure result
            (n, ())
        });

        if res.is_err() {
            -1
        } else {
            out_n
        }
    }
}

#[no_mangle]
pub extern "C" fn rust_net_send(buf: *const u8, len: i32) -> i32 {
    if buf.is_null() || len <= 0 {
        return -1;
    }
    unsafe {
        let sockets = match SOCKET_SET.as_mut() {
            Some(s) => s,
            None => return -1,
        };
        let handle = match TCP_HANDLE {
            Some(h) => h,
            None => return -1,
        };
        let socket = sockets.get_mut::<tcp::Socket>(handle);

        // Only send if TCP state/window allows
        if !socket.may_send() {
            return 0; // would block / not ready
        }

        let slice = core::slice::from_raw_parts(buf, len as usize);

        match socket.send_slice(slice) {
            Ok(n) => n as i32, // actual bytes queued
            Err(_) => -1,
        }
    }
}


#[no_mangle]
pub extern "C" fn rust_net_close() {
    unsafe {
        let sockets = match SOCKET_SET.as_mut() {
            Some(s) => s,
            None => return,
        };
        let handle = match TCP_HANDLE {
            Some(h) => h,
            None => return,
        };
        let socket = sockets.get_mut::<tcp::Socket>(handle);
        socket.close();
    }
}
```

# Testing & Conclusion

From my linux host, I've then created a tap device:

```bash
sudo modprobe tun
sudo ip tuntap add dev tap0 mode tap user "$USER"
sudo ip addr add 10.0.3.1/24 dev tap0
```

And put in on the `10.0.3.1/24` network. On the xv6 device I've then hardcoded an ip and MAC address (I don't have a dhcp server running on my host):

```rust
const MY_MAC_BYTES: [u8; 6] = [0x02, 0xaa, 0xbb, 0xcc, 0xdd, 0xee];
const MY_IP_V4: Ipv4Address = Ipv4Address::new(10, 0, 3, 2);
```

And asked ChatGPT to write a simple HTTP server using the syscalls written above:

```c
//server.c, generated by ChatGPT 5.1
#include "types.h"
#include "stat.h"
#include "user.h"

// Returns 1 if request body == "close"
static int
body_is_close(char *buf, int n)
{
  if(n <= 0) return 0;

  // find "\r\n\r\n" manually
  int i;
  for(i = 0; i+3 < n; i++){
    if(buf[i]   == '\r' &&
       buf[i+1] == '\n' &&
       buf[i+2] == '\r' &&
       buf[i+3] == '\n')
    {
      // body begins after the blank line
      int body_start = i + 4;

      // skip spaces/newlines
      while(body_start < n &&
           (buf[body_start] == ' ' ||
            buf[body_start] == '\n' ||
            buf[body_start] == '\r'))
        body_start++;

      // check for "close"
      if(body_start + 5 <= n &&
         buf[body_start]   == 'c' &&
         buf[body_start+1] == 'l' &&
         buf[body_start+2] == 'o' &&
         buf[body_start+3] == 's' &&
         buf[body_start+4] == 'e')
        return 1;

      return 0; // found body, but not "close"
    }
  }
  return 0; // didn't find end of headers
}

int
main(void)
{
  for(;;){
    // Put the TCP socket back into LISTEN state each iteration.
    // On first iteration the socket is Closed; later it is Closed again
    // after net_close().
    if(net_listen(80) < 0){
      printf(2, "httpd: net_listen(80) failed\n");
      exit();
    }

    printf(1, "httpd: listening on port 80\n");

    // Wait until the TCP connection reaches Established
    while(net_accept() == 0)
      sleep(10);

    printf(1, "httpd: connection established\n");

    char buf[512];
    int n = net_recv(buf, sizeof(buf));

    if(n > 0)
      printf(1, "httpd: received %d bytes\n", n);

    if(body_is_close(buf, n)){
      // Shutdown reply
      static const char hdr[] =
        "HTTP/1.0 200 OK\r\n"
        "Content-Length: 13\r\n"
        "Content-Type: text/plain\r\n"
        "\r\n";
      static const char body[] = "shutting down\n"; // 13 bytes

      net_send((void*)hdr,  sizeof(hdr)  - 1);
      net_send((void*)body, sizeof(body) - 1);
      net_close();

      printf(1, "httpd: close command received, exiting.\n");
      exit();
    } else {
      // Normal reply
      static const char hdr[] =
        "HTTP/1.0 200 OK\r\n"
        "Content-Length: 13\r\n"
        "Content-Type: text/plain\r\n"
        "\r\n";
      static const char body[] = "hi from user\n"; // 13 bytes

      net_send((void*)hdr,  sizeof(hdr)  - 1);
      net_send((void*)body, sizeof(body) - 1);
      net_close();

    }
  }
}
```

This server returns a simple message when a GET request is sent, and shuts down when someones POSTs "close".

![final test](/assets/posts/xv6-networking/final_test.png)
> *On the left: qemu running xv6 with rust networking, on the right: linux host connecting to the server. The final `ls` output shows that sending a `close` in the post payload shuts down the server.*

# Code & Patch

The code is accessible at [github.com/Ferryistaken/xv6-public](https://github.com/Ferryistaken/xv6-public), and a full patch is pasted below.

```diff
diff --git a/.gitignore b/.gitignore
index 3e2c9de..3803857 100644
--- a/.gitignore
+++ b/.gitignore
@@ -14,3 +14,5 @@ kernel
 kernelmemfs
 mkfs
 .gdbinit
+
+rust_networking/target/
diff --git a/Makefile b/Makefile
index 09d790c..8ac35cc 100644
--- a/Makefile
+++ b/Makefile
@@ -21,12 +21,20 @@ OBJS = \
 	swtch.o\
 	syscall.o\
 	sysfile.o\
+	sysnet.o\
 	sysproc.o\
 	trapasm.o\
 	trap.o\
 	uart.o\
 	vectors.o\
 	vm.o\
+	e1000.o\
+	pci.o\
+
+# Rust kernel module
+RUST_DIR    = rust_networking
+RUST_TARGET = i686-unknown-linux-gnu
+RUST_LIB    = $(RUST_DIR)/target/$(RUST_TARGET)/release/librustnet.a
 
 # Cross-compiling (e.g., on Mac OS X)
 # TOOLPREFIX = i386-jos-elf
@@ -76,7 +84,7 @@ AS = $(TOOLPREFIX)gas
 LD = $(TOOLPREFIX)ld
 OBJCOPY = $(TOOLPREFIX)objcopy
 OBJDUMP = $(TOOLPREFIX)objdump
-CFLAGS = -fno-pic -static -fno-builtin -fno-strict-aliasing -O2 -Wall -MD -ggdb -m32 -Werror -fno-omit-frame-pointer
+CFLAGS = -fno-pic -static -fno-builtin -fno-strict-aliasing -O2 -Wall -MD -ggdb -m32 -Werror -Wno-error=array-bounds -Wno-error=infinite-recursion -fno-omit-frame-pointer
 CFLAGS += $(shell $(CC) -fno-stack-protector -E -x c /dev/null >/dev/null 2>&1 && echo -fno-stack-protector)
 ASFLAGS = -m32 -gdwarf-2 -Wa,-divide
 # FreeBSD ld wants ``elf_i386_fbsd''
@@ -116,12 +124,16 @@ entryother: entryother.S
 
 initcode: initcode.S
 	$(CC) $(CFLAGS) -nostdinc -I. -c initcode.S
+	$(OBJCOPY) --remove-section .note.gnu.property initcode.o
 	$(LD) $(LDFLAGS) -N -e start -Ttext 0 -o initcode.out initcode.o
 	$(OBJCOPY) -S -O binary initcode.out initcode
 	$(OBJDUMP) -S initcode.o > initcode.asm
 
-kernel: $(OBJS) entry.o entryother initcode kernel.ld
-	$(LD) $(LDFLAGS) -T kernel.ld -o kernel entry.o $(OBJS) -b binary initcode entryother
+$(RUSTMOD_LIB):
+	cd $(RUSTMOD_DIR) && cargo build --release
+
+kernel: $(OBJS) $(RUST_LIB) entry.o entryother initcode kernel.ld
+	$(LD) $(LDFLAGS) -T kernel.ld -o kernel entry.o $(OBJS) $(RUST_LIB) -b binary initcode entryother
 	$(OBJDUMP) -S kernel > kernel.asm
 	$(OBJDUMP) -t kernel | sed '1,/SYMBOL TABLE/d; s/ .* / /; /^$$/d' > kernel.sym
 
@@ -146,6 +158,7 @@ vectors.S: vectors.pl
 ULIB = ulib.o usys.o printf.o umalloc.o
 
 _%: %.o $(ULIB)
+	$(OBJCOPY) --remove-section .note.gnu.property ulib.o
 	$(LD) $(LDFLAGS) -N -e main -Ttext 0 -o $@ $^
 	$(OBJDUMP) -S $@ > $*.asm
 	$(OBJDUMP) -t $@ | sed '1,/SYMBOL TABLE/d; s/ .* / /; /^$$/d' > $*.sym
@@ -181,6 +194,7 @@ UPROGS=\
 	_usertests\
 	_wc\
 	_zombie\
+	_server\
 
 fs.img: mkfs README $(UPROGS)
 	./mkfs fs.img README $(UPROGS)
@@ -192,6 +206,7 @@ clean:
 	*.o *.d *.asm *.sym vectors.S bootblock entryother \
 	initcode initcode.out kernel xv6.img fs.img kernelmemfs \
 	xv6memfs.img mkfs .gdbinit \
+	rustmod/target -r \
 	$(UPROGS)
 
 # make a printout
@@ -219,7 +234,9 @@ QEMUGDB = $(shell if $(QEMU) -help | grep -q '^-gdb'; \
 ifndef CPUS
 CPUS := 2
 endif
-QEMUOPTS = -drive file=fs.img,index=1,media=disk,format=raw -drive file=xv6.img,index=0,media=disk,format=raw -smp $(CPUS) -m 512 $(QEMUEXTRA)
+QEMUOPTS = -drive file=fs.img,index=1,media=disk,format=raw -drive file=xv6.img,index=0,media=disk,format=raw -smp $(CPUS) -m 512 $(QEMUEXTRA)\
+		   -netdev tap,id=net0,ifname=tap0,script=no,downscript=no -device e1000,netdev=net0,mac=02:aa:bb:cc:dd:ee
+
 
 qemu: fs.img xv6.img
 	$(QEMU) -serial mon:stdio $(QEMUOPTS)
diff --git a/console.c b/console.c
index a280d2b..7c8b97f 100644
--- a/console.c
+++ b/console.c
@@ -19,6 +19,16 @@ static void consputc(int);
 
 static int panicked = 0;
 
+void
+c_kputs(const char *s)
+{
+  if(s == 0)
+    return;
+  for(; *s; s++){
+    consputc(*s);
+  }
+}
+
 static struct {
   struct spinlock lock;
   int locking;
diff --git a/defs.h b/defs.h
index 82fb982..27ce0ae 100644
--- a/defs.h
+++ b/defs.h
@@ -10,6 +10,30 @@ struct sleeplock;
 struct stat;
 struct superblock;
 
+// external rust
+extern void rust_test(void);
+void rust_tx_frame(const uchar *buf, int len);
+
+// pci.c
+void pci_scan_bus0(void);
+uint pci_config_read32(uint bus, uint slot, uint func, uint offset);
+void pci_config_write32(uint, uint, uint, uint, uint);
+
+// e1000.c
+void  e1000_init(void);
+void  e1000_intr(void);
+int   e1000_tx(const void *data, int len);
+int   e1000_rx_poll(uchar *buf, int maxlen);
+extern void rust_net_rx(const unsigned char *buf, int len);
+extern void rust_tx_frame(const unsigned char *buf, int len);
+
+int  net_listen(int port);          // start listening on TCP port
+int  net_accept(void);              // returns 1 if a connection is established, 0 if not yet, -1 on error
+int  net_recv(void *buf, int n);    // returns bytes read, 0 if no data, -1 on error
+int  net_send(void *buf, int n);    // returns bytes sent, 0 if would-block, -1 on error
+int  net_close(void);               // close current connection
+
+
 // bio.c
 void            binit(void);
 struct buf*     bread(uint, uint);
@@ -173,6 +197,7 @@ void            uartputc(int);
 // vm.c
 void            seginit(void);
 void            kvmalloc(void);
+int             mappages(pde_t *pgdir, void *va, uint size, uint pa, int perm);
 pde_t*          setupkvm(void);
 char*           uva2ka(pde_t*, char*);
 int             allocuvm(pde_t*, uint, uint);
diff --git a/e1000.c b/e1000.c
new file mode 100644
index 0000000..32a976e
--- /dev/null
+++ b/e1000.c
@@ -0,0 +1,317 @@
+#include "types.h"
+#include "defs.h"
+#include "x86.h"
+#include "memlayout.h"
+#include "e1000.h"
+#include "mmu.h"
+#include "traps.h"
+
+struct e1000_tx_desc tx_ring[TX_RING_SIZE] __attribute__((aligned(16)));
+struct e1000_rx_desc rx_ring[RX_RING_SIZE] __attribute__((aligned(16)));
+
+uchar tx_bufs[TX_RING_SIZE][PKT_BUF_SIZE] __attribute__((aligned(16)));
+uchar rx_bufs[RX_RING_SIZE][PKT_BUF_SIZE] __attribute__((aligned(16)));
+
+int tx_tail;  // software view of TDT
+int rx_next;  // next RX descriptor to check
+
+volatile uint *e1000_regs;
+
+extern pde_t *kpgdir;
+
+// Provided by Rust (smoltcp stack)
+// e1000.c
+extern void rust_net_init(void);
+extern void rust_net_poll(void);
+extern uint net_time_msec(void);
+
+// Time source for Rust/smoltcp
+extern uint ticks;  // from trap.c in xv6
+
+typedef char assert_tx_desc_size[
+  sizeof(struct e1000_tx_desc) == 16 ? 1 : -1
+];
+
+typedef char assert_rx_desc_size[
+  sizeof(struct e1000_rx_desc) == 16 ? 1 : -1
+];
+
+static uint
+e1000_read_reg(uint offset)
+{
+  return e1000_regs[offset/4];
+}
+
+static void
+e1000_write_reg(uint offset, uint val)
+{
+  e1000_regs[offset/4] = val;
+}
+
+static void
+e1000_test_send(void)
+{
+  uchar pkt[64];
+
+  // Fake Ethernet frame: dst broadcast, src all 1s, ethertype 0x9000, payload 'RUST!'
+  int i;
+  for(i = 0; i < 6; i++) pkt[i] = 0xff;        // dst MAC: ff:ff:ff:ff:ff:ff
+  for(i = 0; i < 6; i++) pkt[6+i] = 0x11;      // src MAC: 11:11:11:11:11:11
+  pkt[12] = 0x90; pkt[13] = 0x00;             // ethertype (made up)
+
+  const char *msg = "hello from xv6 e1000\n";
+  int mlen = strlen(msg);
+  if(mlen > (int)(sizeof(pkt) - 14))
+    mlen = sizeof(pkt) - 14;
+  memmove(&pkt[14], msg, mlen);
+
+  int len = 14 + mlen;
+  if(len < 60) len = 60; // minimum Ethernet frame size (without FCS)
+
+  if(e1000_tx(pkt, len) == 0)
+    cprintf("e1000: test packet sent (%d bytes)\n", len);
+  else
+    cprintf("e1000: TX ring full, test packet not sent\n");
+}
+
+void
+e1000_debug_dump(void)
+{
+  cprintf("e1000_debug_dump: TDH=%d TDT=%d\n",
+          e1000_read_reg(E1000_TDH),
+          e1000_read_reg(E1000_TDT));
+
+  for (int i = 0; i < 4; i++) {
+    cprintf("  tx[%d]: addr_lo=0x%x len=%d cmd=0x%x status=0x%x\n",
+            i, tx_ring[i].addr_lo, tx_ring[i].length,
+            tx_ring[i].cmd, tx_ring[i].status);
+  }
+}
+
+void
+e1000_init(void)
+{
+  ioapicenable(IRQ_E1000, 0);
+  uint bus = 0;
+  uint slot = 3;   // from your QEMU config: -net nic,model=e1000 puts it here
+
+  // 1) Read BAR0 from PCI config space
+  uint bar0 = pci_config_read32(bus, slot, 0, 0x10);
+  uint mmio_pa = bar0 & ~0xF;
+
+  // Map one page of MMIO into kernel virtual address space.
+  // Align to page, use P2V to choose a kernel VA.
+  uint pa_page = mmio_pa & ~(PGSIZE - 1);
+  void *va_page = (void*)P2V(pa_page);
+  uint mmio_size = 0x4000; // 4 pages
+
+  // Mark as present + writable + uncached (PCD/PWT if you want to be fancy).
+  int perm = PTE_W | PTE_P;
+
+  if(mappages(kpgdir, va_page, mmio_size, pa_page, perm) < 0){
+    cprintf("e1000: mappages failed for mmio_pa=0x%x\n", mmio_pa);
+    return;
+  }
+
+  // Reload CR3 so CPU picks up new mapping
+  lcr3(V2P(kpgdir));
+
+  // Now it is safe to compute the exact virtual address
+  e1000_regs = (volatile uint *)P2V(mmio_pa);
+
+  cprintf("e1000: BAR0=0x%x mmio_pa=0x%x regs=%p\n", bar0, mmio_pa, e1000_regs);
+
+  // 2) Basic sanity: print STATUS (optional, but nice)
+  uint status = e1000_read_reg(E1000_STATUS);
+  cprintf("e1000: status=0x%x\n", status);
+
+  // Enable bus mastering + memory space on the PCI device
+  uint cmd = pci_config_read32(bus, slot, 0, 0x04);
+  ushort cmd_lo = cmd & 0xFFFF;
+
+  // Bit 1 = Memory Space Enable, Bit 2 = Bus Master Enable
+  cmd_lo |= 0x0002; // MSE
+  cmd_lo |= 0x0004; // BME
+
+  cmd = (cmd & 0xFFFF0000) | cmd_lo;
+  pci_config_write32(bus, slot, 0, 0x04, cmd);
+
+  cprintf("e1000: PCI CMD=0x%x\n", cmd_lo);
+
+  // 3) Init TX ring
+  int i;
+  for(i = 0; i < TX_RING_SIZE; i++){
+    tx_ring[i].addr_lo = V2P(tx_bufs[i]);
+    tx_ring[i].addr_hi = 0;
+    tx_ring[i].length  = 0;
+    tx_ring[i].cso     = 0;
+    tx_ring[i].cmd     = E1000_TXD_CMD_RS | E1000_TXD_CMD_IFCS;
+    tx_ring[i].status  = E1000_TXD_STAT_DD;  // mark free
+    tx_ring[i].css     = 0;
+    tx_ring[i].special = 0;
+  }
+
+  e1000_write_reg(E1000_TDBAL, V2P(tx_ring));
+  e1000_write_reg(E1000_TDBAH, 0);
+  e1000_write_reg(E1000_TDLEN, sizeof(tx_ring));
+  e1000_write_reg(E1000_TDH, 0);
+  e1000_write_reg(E1000_TDT, 0);
+  tx_tail = 0;
+
+  // 4) Init RX ring
+  for(i = 0; i < RX_RING_SIZE; i++){
+    rx_ring[i].addr_lo = V2P(rx_bufs[i]);
+    rx_ring[i].addr_hi = 0;
+    rx_ring[i].length  = 0;
+    rx_ring[i].csum    = 0;
+    rx_ring[i].status  = 0;   // owned by NIC
+    rx_ring[i].errors  = 0;
+    rx_ring[i].special = 0;
+  }
+
+  e1000_write_reg(E1000_RDBAL, V2P(rx_ring));
+  e1000_write_reg(E1000_RDBAH, 0);
+  e1000_write_reg(E1000_RDLEN, sizeof(rx_ring));
+  e1000_write_reg(E1000_RDH, 0);
+  e1000_write_reg(E1000_RDT, RX_RING_SIZE - 1);
+  rx_next = 0;
+
+  // 5) Configure transmit control
+  uint tctl = 0;
+  tctl |= E1000_TCTL_EN;   // enable TX
+  tctl |= E1000_TCTL_PSP;  // pad short packets
+  tctl |= (0x10 << E1000_TCTL_CT_SHIFT);   // collision threshold ~16
+  tctl |= (0x40 << E1000_TCTL_COLD_SHIFT); // collision distance ~64
+  e1000_write_reg(E1000_TCTL, tctl);
+
+  // 6) Configure inter-packet gap
+  uint tipg = 0;
+  tipg |= E1000_TIPG_IPGT;
+  tipg |= (E1000_TIPG_IPGR1 << E1000_TIPG_IPGR1_SHIFT);
+  tipg |= (E1000_TIPG_IPGR2 << E1000_TIPG_IPGR2_SHIFT);
+  e1000_write_reg(E1000_TIPG, tipg);
+
+  // 7) Configure receive control
+  uint rctl = 0;
+  rctl |= E1000_RCTL_EN;        // enable RX
+  rctl |= E1000_RCTL_BAM;       // accept broadcast
+  rctl |= E1000_RCTL_UPE;       // accept all unicast
+  rctl |= E1000_RCTL_MPE;       // accept all multicast
+  rctl |= E1000_RCTL_SZ_2048;   // 2K buffers
+  rctl |= E1000_RCTL_SECRC;     // strip CRC
+  e1000_write_reg(E1000_RCTL, rctl);
+
+  e1000_write_reg(E1000_IMC, 0xffffffff);  // mask all
+  (void)e1000_read_reg(E1000_ICR);         // clear pending
+  e1000_write_reg(E1000_IMS,
+                  E1000_IMS_RXT0 |   // RX timer / normal receive
+                  E1000_IMS_RXO  |   // RX overrun (optional)
+                  E1000_IMS_RXDMT0 | // RX desc low watermark
+                  E1000_IMS_TXDW);   // TX descriptor write-back
+
+  // debug: read back RCTL to confirm
+  uint rctl_read = e1000_read_reg(E1000_RCTL);
+  cprintf("e1000: RCTL=0x%x\n", rctl_read);
+
+  (void)e1000_test_send;
+  // e1000_test_send();  // optional
+
+  cprintf("e1000: initialized\n");
+
+  // Initialize Rust+smoltcp stack now that NIC is ready.
+  rust_net_init();
+}
+
+int
+e1000_tx(const void *data, int len)
+{
+  if(len <= 0 || len > PKT_BUF_SIZE)
+    return -1;
+
+  int tdt = e1000_read_reg(E1000_TDT);
+  struct e1000_tx_desc *d = &tx_ring[tdt];
+
+  cprintf("e1000_tx: tdt=%d status=0x%x\n", tdt, d->status);
+
+  if((d->status & E1000_TXD_STAT_DD) == 0){
+    cprintf("e1000_tx: ring full at %d\n", tdt);
+    return -1;
+  }
+
+  memmove(tx_bufs[tdt], data, len);
+
+  d->length = len;
+  d->status = 0;
+  d->cmd = E1000_TXD_CMD_RS | E1000_TXD_CMD_EOP | E1000_TXD_CMD_IFCS;
+
+  tdt = (tdt + 1) % TX_RING_SIZE;
+  e1000_write_reg(E1000_TDT, tdt);
+
+  cprintf("e1000_tx: queued len=%d new TDT=%d\n", len, tdt);
+  return 0;
+}
+
+int
+e1000_rx_poll(uchar *buf, int maxlen)
+{
+  struct e1000_rx_desc *d = &rx_ring[rx_next];
+
+  if((d->status & E1000_RXD_STAT_DD) == 0)
+    return -1;
+
+  int n = 0;
+
+  if((d->status & E1000_RXD_STAT_EOP) == 0){
+    cprintf("e1000: RX fragment, dropping (len=%d status=0x%x)\n",
+                  d->length, d->status);
+    // n stays 0 → caller won't use this packet
+    goto rearm;
+  }
+
+  n = d->length;
+  if(n > maxlen)
+    n = maxlen;
+
+  memmove(buf, rx_bufs[rx_next], n);
+
+rearm:
+  d->status = 0;
+  d->errors = 0;
+
+  rx_next = (rx_next + 1) % RX_RING_SIZE;
+  int rdt = (rx_next + RX_RING_SIZE - 1) % RX_RING_SIZE;
+  e1000_write_reg(E1000_RDT, rdt);
+
+  return n;
+}
+
+void
+e1000_intr(void)
+{
+  uint icr = e1000_read_reg(E1000_ICR);
+
+  if(icr == 0)
+    return;
+
+  // RX-related interrupt?
+  if(icr & (E1000_ICR_RXT0 | E1000_ICR_RXDMT0 | E1000_ICR_RXO)){
+    // Let Rust+smoltcp pull packets with e1000_rx_poll() and handle them.
+    cprintf("handling packet in rust\n");
+    rust_net_poll();
+  }
+
+  if(icr & E1000_ICR_TXDW){
+    cprintf("e1000: TXDW\n");
+  }
+
+  (void)e1000_debug_dump;
+}
+
+// Monotonic time in milliseconds for smoltcp
+uint
+net_time_msec(void)
+{
+  // xv6 timer runs at 100 Hz: 1 tick = 10ms
+  // adjust factor if you've changed HZ.
+  return (uint)ticks * 10ULL;
+}
diff --git a/e1000.h b/e1000.h
new file mode 100644
index 0000000..44f53d3
--- /dev/null
+++ b/e1000.h
@@ -0,0 +1,121 @@
+#include "types.h"
+
+extern void e1000_intr(void);
+
+#define PCI_CONFIG_ADDRESS 0xCF8
+#define PCI_CONFIG_DATA    0xCFC
+// Interrupt registers
+#define E1000_ICR    0xC0   // Interrupt Cause Read
+#define E1000_IMS    0xD0   // Interrupt Mask Set
+#define E1000_IMC    0xD8   // Interrupt Mask Clear
+
+// ICR/IMS/IMC bit masks (we’ll use a subset)
+#define E1000_ICR_TXDW    0x00000001   // TX descriptor written back
+#define E1000_ICR_RXDMT0  0x00000010   // RX ring below threshold
+#define E1000_ICR_RXO     0x00000040   // RX overrun
+#define E1000_ICR_RXT0    0x00000080   // RX "timer" (normal receive)
+
+// For convenience, mirror these for IMS/IMC
+#define E1000_IMS_TXDW    E1000_ICR_TXDW
+#define E1000_IMS_RXDMT0  E1000_ICR_RXDMT0
+#define E1000_IMS_RXO     E1000_ICR_RXO
+#define E1000_IMS_RXT0    E1000_ICR_RXT0
+
+#define TX_RING_SIZE   16
+#define RX_RING_SIZE   16
+#define PKT_BUF_SIZE   2048   // fits in one 2k buffer
+
+// MMIO register offsets (byte offsets, divide by 4 when indexing e1000_regs)
+#define E1000_CTRL    0x0000
+#define E1000_STATUS  0x0008
+
+// RX
+#define E1000_RCTL    0x0100
+#define E1000_RDBAL   0x2800
+#define E1000_RDBAH   0x2804
+#define E1000_RDLEN   0x2808
+#define E1000_RDH     0x2810
+#define E1000_RDT     0x2818
+
+#define E1000_RCTL_EN      0x00000002
+#define E1000_RCTL_SBP     0x00000004
+#define E1000_RCTL_UPE     0x00000008   // unicast promiscuous
+#define E1000_RCTL_MPE     0x00000010   // multicast promiscuous
+#define E1000_RCTL_BAM     0x00008000   // broadcast accept
+#define E1000_RCTL_SECRC   0x04000000
+#define E1000_RCTL_SZ_2048 0x00000000   // (on real E1000, 0 = 2K)
+
+// TX
+#define E1000_TCTL    0x0400
+#define E1000_TIPG    0x0410
+#define E1000_TDBAL   0x3800
+#define E1000_TDBAH   0x3804
+#define E1000_TDLEN   0x3808
+#define E1000_TDH     0x3810
+#define E1000_TDT     0x3818
+
+// Transmit Control bits
+#define E1000_TCTL_EN       0x00000002  // enable tx
+#define E1000_TCTL_PSP      0x00000008  // pad short packets
+#define E1000_TCTL_CT_SHIFT 4           // collision threshold field shift
+#define E1000_TCTL_COLD_SHIFT 12        // collision distance field shift
+
+// Receive Control bits
+#define E1000_RCTL_EN       0x00000002  // enable rx
+#define E1000_RCTL_BAM      0x00008000  // accept broadcast
+#define E1000_RCTL_SZ_2048  0x00000000  // 2048-byte buffers
+#define E1000_RCTL_SECRC    0x04000000  // strip Ethernet CRC
+
+// TIPG fields (we'll use IPGT=10, IPGR1=8, IPGR2=6)
+#define E1000_TIPG_IPGT        10
+#define E1000_TIPG_IPGR1       8
+#define E1000_TIPG_IPGR2       6
+#define E1000_TIPG_IPGR1_SHIFT 10
+#define E1000_TIPG_IPGR2_SHIFT 20
+
+// TX descriptor cmd bits
+#define E1000_TXD_CMD_EOP  0x01  // end of packet
+#define E1000_TXD_CMD_IFCS 0x02  // insert FCS
+#define E1000_TXD_CMD_RS   0x08  // report status
+
+// TX descriptor status bits
+#define E1000_TXD_STAT_DD  0x01  // descriptor done
+
+// RX descriptor status bits
+#define E1000_RXD_STAT_DD  0x01  // descriptor done
+#define E1000_RXD_STAT_EOP 0x02  // end of packet
+
+
+// Legacy TX descriptor (16 bytes)
+struct e1000_tx_desc {
+  uint   addr_lo;
+  uint   addr_hi;
+  ushort length;
+  uchar  cso;
+  uchar  cmd;
+  uchar  status;
+  uchar  css;
+  ushort special;
+} __attribute__((packed));
+
+// Legacy RX descriptor (16 bytes)
+struct e1000_rx_desc {
+  uint   addr_lo;
+  uint   addr_hi;
+  ushort length;
+  ushort csum;
+  uchar  status;
+  uchar  errors;
+  ushort special;
+} __attribute__((packed));
+
+extern struct e1000_tx_desc tx_ring[TX_RING_SIZE];
+extern struct e1000_rx_desc rx_ring[RX_RING_SIZE];
+
+extern uchar tx_bufs[TX_RING_SIZE][PKT_BUF_SIZE];
+extern uchar rx_bufs[RX_RING_SIZE][PKT_BUF_SIZE];
+
+extern int tx_tail;
+extern int rx_next;
+
+extern volatile uint *e1000_regs;
diff --git a/main.c b/main.c
index 9924e64..0e51171 100644
--- a/main.c
+++ b/main.c
@@ -33,6 +33,8 @@ main(void)
   ideinit();       // disk 
   startothers();   // start other processors
   kinit2(P2V(4*1024*1024), P2V(PHYSTOP)); // must come after startothers()
+  pci_scan_bus0();
+  e1000_init();
   userinit();      // first user process
   mpmain();        // finish this processor's setup
 }
diff --git a/pci.c b/pci.c
new file mode 100644
index 0000000..8ad1394
--- /dev/null
+++ b/pci.c
@@ -0,0 +1,63 @@
+#include "types.h"
+#include "defs.h"
+#include "x86.h"
+
+#define PCI_CONFIG_ADDRESS 0xCF8
+#define PCI_CONFIG_DATA    0xCFC
+
+void
+pci_print_irq(uint bus, uint slot)
+{
+  uint v = pci_config_read32(bus, slot, 0, 0x3C);
+  uchar line = v & 0xFF;
+  uchar pin  = (v >> 8) & 0xFF;
+  cprintf("pci: bus %d slot %d: int line=%d pin=%d\n",
+          bus, slot, line, pin);
+}
+
+uint
+pci_config_read32(uint bus, uint slot, uint func, uint offset)
+{
+  uint address =
+    (1U << 31) |
+    (bus  << 16) |
+    (slot << 11) |
+    (func << 8) |
+    (offset & 0xFC);
+
+  outl(PCI_CONFIG_ADDRESS, address);
+  return inl(PCI_CONFIG_DATA);
+}
+
+void
+pci_config_write32(uint bus, uint slot, uint func, uint offset, uint val)
+{
+  uint address =
+    (1U << 31) |
+    (bus  << 16) |
+    (slot << 11) |
+    (func << 8)  |
+    (offset & 0xFC);
+
+  outl(PCI_CONFIG_ADDRESS, address);
+  outl(PCI_CONFIG_DATA, val);
+}
+
+void
+pci_scan_bus0(void)
+{
+  cprintf("Scanning for pci devices...\n");
+  for(uint slot = 0; slot < 32; slot++) {
+    uint v = pci_config_read32(0, slot, 0, 0);
+    ushort vendor = v & 0xFFFF;
+    ushort device = (v >> 16) & 0xFFFF;
+
+    if(vendor == 0xFFFF)
+      continue;
+
+    cprintf("\tpci: bus 0, slot %d: vendor 0x%x device 0x%x\n",
+            slot, vendor, device);
+  }
+  pci_print_irq(0, 3);
+}
+
diff --git a/rust_networking/.cargo/config.toml b/rust_networking/.cargo/config.toml
new file mode 100644
index 0000000..65c8a1a
--- /dev/null
+++ b/rust_networking/.cargo/config.toml
@@ -0,0 +1,13 @@
+[build]
+target = "i686-unknown-linux-gnu"
+
+[target.i686-unknown-linux-gnu]
+linker = "gcc"
+rustflags = [
+  "-C", "relocation-model=static",
+  "-C", "link-arg=-m32",
+  "-C", "target-feature=-mmx,-sse,-sse2,-sse3,-ssse3,-sse4.1,-sse4.2,-avx,-avx2",
+  "-C", "soft-float",
+]
+
+
diff --git a/rust_networking/Cargo.lock b/rust_networking/Cargo.lock
new file mode 100644
index 0000000..8a78e3b
--- /dev/null
+++ b/rust_networking/Cargo.lock
@@ -0,0 +1,72 @@
+# This file is automatically @generated by Cargo.
+# It is not intended for manual editing.
+version = 4
+
+[[package]]
+name = "bitflags"
+version = "1.3.2"
+source = "registry+https://github.com/rust-lang/crates.io-index"
+checksum = "bef38d45163c2f1dde094a7dfd33ccf595c92905c8f8f4fdc18d06fb1037718a"
+
+[[package]]
+name = "byteorder"
+version = "1.5.0"
+source = "registry+https://github.com/rust-lang/crates.io-index"
+checksum = "1fd0f2584146f6f2ef48085050886acf353beff7305ebd1ae69500e27c67f64b"
+
+[[package]]
+name = "cfg-if"
+version = "1.0.4"
+source = "registry+https://github.com/rust-lang/crates.io-index"
+checksum = "9330f8b2ff13f34540b44e946ef35111825727b38d33286ef986142615121801"
+
+[[package]]
+name = "hash32"
+version = "0.3.1"
+source = "registry+https://github.com/rust-lang/crates.io-index"
+checksum = "47d60b12902ba28e2730cd37e95b8c9223af2808df9e902d4df49588d1470606"
+dependencies = [
+ "byteorder",
+]
+
+[[package]]
+name = "heapless"
+version = "0.8.0"
+source = "registry+https://github.com/rust-lang/crates.io-index"
+checksum = "0bfb9eb618601c89945a70e254898da93b13be0388091d42117462b265bb3fad"
+dependencies = [
+ "hash32",
+ "stable_deref_trait",
+]
+
+[[package]]
+name = "managed"
+version = "0.8.0"
+source = "registry+https://github.com/rust-lang/crates.io-index"
+checksum = "0ca88d725a0a943b096803bd34e73a4437208b6077654cc4ecb2947a5f91618d"
+
+[[package]]
+name = "rustnet"
+version = "0.1.0"
+dependencies = [
+ "smoltcp",
+]
+
+[[package]]
+name = "smoltcp"
+version = "0.12.0"
+source = "registry+https://github.com/rust-lang/crates.io-index"
+checksum = "dad095989c1533c1c266d9b1e8d70a1329dd3723c3edac6d03bbd67e7bf6f4bb"
+dependencies = [
+ "bitflags",
+ "byteorder",
+ "cfg-if",
+ "heapless",
+ "managed",
+]
+
+[[package]]
+name = "stable_deref_trait"
+version = "1.2.1"
+source = "registry+https://github.com/rust-lang/crates.io-index"
+checksum = "6ce2be8dc25455e1f91df71bfa12ad37d7af1092ae736f3a6cd0e37bc7810596"
diff --git a/rust_networking/Cargo.toml b/rust_networking/Cargo.toml
new file mode 100644
index 0000000..0c87eaf
--- /dev/null
+++ b/rust_networking/Cargo.toml
@@ -0,0 +1,20 @@
+[package]
+name = "rustnet"
+version = "0.1.0"
+edition = "2021"
+
+[lib]
+crate-type = ["staticlib"]
+
+[profile.release]
+panic = "abort"
+lto = true
+codegen-units = 1
+
+[dependencies]
+smoltcp = { version = "0.12.0", default-features = false, features = [
+    "proto-ipv4",
+    "socket-tcp",
+    "socket-udp",
+    "medium-ethernet",
+] }
diff --git a/rust_networking/src/lib.rs b/rust_networking/src/lib.rs
new file mode 100644
index 0000000..f122724
--- /dev/null
+++ b/rust_networking/src/lib.rs
@@ -0,0 +1,360 @@
+#![no_std]
+#![allow(static_mut_refs)]
+
+use core::ffi::c_int;
+use core::panic::PanicInfo;
+
+use smoltcp::iface::{Config, Interface, SocketHandle, SocketSet, SocketStorage};
+use smoltcp::phy::{Device, DeviceCapabilities, Medium, RxToken, TxToken};
+use smoltcp::time::Instant;
+use smoltcp::wire::{EthernetAddress, HardwareAddress, IpAddress, IpCidr, Ipv4Address};
+use smoltcp::socket::tcp;
+
+extern "C" {
+    fn c_kputs(msg: *const u8);
+    fn e1000_rx_poll(buf: *mut u8, maxlen: c_int) -> c_int;
+    fn e1000_tx(buf: *const u8, len: c_int) -> c_int;
+    fn net_time_msec() -> u64;
+}
+
+/// Simple helper: print a null-terminated static string.
+unsafe fn puts_const(msg: &'static [u8]) {
+    c_kputs(msg.as_ptr());
+}
+
+// ---- Configuration constants ----
+
+const MAX_FRAME_SIZE: usize = 2048;
+const NUM_SOCKETS: usize = 4;
+
+const MY_MAC_BYTES: [u8; 6] = [0x02, 0xaa, 0xbb, 0xcc, 0xdd, 0xee];
+const MY_IP_V4: Ipv4Address = Ipv4Address::new(10, 0, 3, 2);
+
+// TCP buffers (single server socket)
+const TCP_RX_BUF_SIZE: usize = 2048;
+const TCP_TX_BUF_SIZE: usize = 2048;
+
+static mut TCP_RX_DATA: [u8; TCP_RX_BUF_SIZE] = [0; TCP_RX_BUF_SIZE];
+static mut TCP_TX_DATA: [u8; TCP_TX_BUF_SIZE] = [0; TCP_TX_BUF_SIZE];
+
+// Handle for the single TCP server socket
+static mut TCP_HANDLE: Option<SocketHandle> = None;
+
+// ---- Time helper ----
+
+fn now() -> Instant {
+    let ms = unsafe { net_time_msec() };
+    Instant::from_millis(ms as i64)
+}
+
+// ---- Device + tokens ----
+
+struct Xv6Device {
+    rx_buf: [u8; MAX_FRAME_SIZE],
+    rx_len: usize,
+    tx_buf: [u8; MAX_FRAME_SIZE],
+}
+
+impl Xv6Device {
+    const fn new() -> Self {
+        Self {
+            rx_buf: [0; MAX_FRAME_SIZE],
+            rx_len: 0,
+            tx_buf: [0; MAX_FRAME_SIZE],
+        }
+    }
+}
+
+struct Xv6RxToken<'a> {
+    buffer: &'a [u8],
+}
+
+struct Xv6TxToken<'a> {
+    buffer: &'a mut [u8],
+}
+
+impl<'a> RxToken for Xv6RxToken<'a> {
+    fn consume<R, F>(self, f: F) -> R
+    where
+        F: FnOnce(&[u8]) -> R,
+    {
+        f(self.buffer)
+    }
+}
+
+impl<'a> TxToken for Xv6TxToken<'a> {
+    fn consume<R, F>(self, len: usize, f: F) -> R
+    where
+        F: FnOnce(&mut [u8]) -> R,
+    {
+        let slice = &mut self.buffer[..len];
+        let result = f(slice);
+
+        unsafe {
+            puts_const(b"rust: smoltcp TxToken::consume, sending frame\n\0");
+            e1000_tx(slice.as_ptr(), len as c_int);
+        }
+
+        result
+    }
+}
+
+impl Device for Xv6Device {
+    type RxToken<'a> = Xv6RxToken<'a> where Self: 'a;
+    type TxToken<'a> = Xv6TxToken<'a> where Self: 'a;
+
+    fn capabilities(&self) -> DeviceCapabilities {
+        let mut caps = DeviceCapabilities::default();
+        caps.medium = Medium::Ethernet;
+        caps.max_transmission_unit = MAX_FRAME_SIZE as usize;
+        caps
+    }
+
+    fn receive(
+        &mut self,
+        _timestamp: Instant,
+    ) -> Option<(Self::RxToken<'_>, Self::TxToken<'_>)> {
+        unsafe { puts_const(b"rust: smoltcp receive() got frame\n\0"); }
+
+        self.rx_len = 0;
+        let n = unsafe { e1000_rx_poll(self.rx_buf.as_mut_ptr(), MAX_FRAME_SIZE as c_int) };
+        if n <= 0 {
+            return None;
+        }
+
+        self.rx_len = n as usize;
+        let rx = Xv6RxToken {
+            buffer: &self.rx_buf[..self.rx_len],
+        };
+        let tx = Xv6TxToken {
+            buffer: &mut self.tx_buf[..],
+        };
+        Some((rx, tx))
+    }
+
+    fn transmit(&mut self, _timestamp: Instant) -> Option<Self::TxToken<'_>> {
+        unsafe { puts_const(b"rust: smoltcp transmit() called\n\0"); }
+        Some(Xv6TxToken {
+            buffer: &mut self.tx_buf[..],
+        })
+    }
+}
+
+// ---- Global interface + sockets + device ----
+
+static mut DEVICE: Xv6Device = Xv6Device::new();
+static mut IFACE: Option<Interface> = None;
+static mut SOCKET_SET: Option<SocketSet<'static>> = None;
+static mut SOCKET_STORAGE: [SocketStorage<'static>; NUM_SOCKETS] =
+    [SocketStorage::EMPTY; NUM_SOCKETS];
+
+#[no_mangle]
+pub extern "C" fn rust_test() {
+    static MSG: &[u8] = b"Rust smoltcp module loaded\n\0";
+    unsafe { puts_const(MSG) }
+}
+
+#[no_mangle]
+pub extern "C" fn rust_net_init() {
+    unsafe {
+        puts_const(b"rust: smoltcp rust_net_init\n\0");
+    }
+
+    unsafe {
+        let dev: &mut Xv6Device = &mut DEVICE;
+
+        let hw = HardwareAddress::Ethernet(EthernetAddress(MY_MAC_BYTES));
+        let mut cfg = Config::new(hw);
+        cfg.random_seed = 0x1234_5678;
+
+        let mut iface = Interface::new(cfg, dev, now());
+
+        // IP 10.0.3.2/24
+        iface.update_ip_addrs(|ip_addrs| {
+            ip_addrs
+                .push(IpCidr::new(IpAddress::Ipv4(MY_IP_V4), 24))
+                .unwrap();
+        });
+
+        // SocketSet + single TCP socket (initially not listening)
+        let mut sockets = SocketSet::new(&mut SOCKET_STORAGE[..]);
+
+        let rx_buf = tcp::SocketBuffer::new(&mut TCP_RX_DATA[..]);
+        let tx_buf = tcp::SocketBuffer::new(&mut TCP_TX_DATA[..]);
+        let sock = tcp::Socket::new(rx_buf, tx_buf);
+
+        let handle = sockets.add(sock);
+        TCP_HANDLE = Some(handle);
+
+        IFACE = Some(iface);
+        SOCKET_SET = Some(sockets);
+    }
+}
+
+/// Called from e1000_intr whenever there is RX/TX work to do.
+#[no_mangle]
+pub extern "C" fn rust_net_poll() {
+    unsafe {
+        let iface = match IFACE.as_mut() {
+            Some(i) => i,
+            None => return,
+        };
+        let sockets = match SOCKET_SET.as_mut() {
+            Some(s) => s,
+            None => return,
+        };
+        let dev: &mut Xv6Device = &mut DEVICE;
+
+        let ts = now();
+        let _ = iface.poll(ts, dev, sockets);
+    }
+}
+
+// ---- Networking FFI for sysnet.c ----
+//
+// All of these are non-blocking:
+// - net_listen(port): 0 on success, -1 on error
+// - net_accept(): 1 if Established, 0 if not yet, -1 on error
+// - net_recv(buf, len): n>0 bytes read, 0 if no data, -1 on error
+// - net_send(buf, len): n>0 bytes queued, 0 if would-block, -1 on error
+// - net_close(): close socket (ignore errors)
+
+#[no_mangle]
+pub extern "C" fn rust_net_listen(port: i32) -> i32 {
+    unsafe {
+        let sockets = match SOCKET_SET.as_mut() {
+            Some(s) => s,
+            None => return -1,
+        };
+        let handle = match TCP_HANDLE {
+            Some(h) => h,
+            None => return -1,
+        };
+        let socket = sockets.get_mut::<tcp::Socket>(handle);
+        match socket.listen(port as u16) {
+            Ok(()) => 0,
+            Err(_) => -1,
+        }
+    }
+}
+
+#[no_mangle]
+pub extern "C" fn rust_net_accept() -> i32 {
+    unsafe {
+        let sockets = match SOCKET_SET.as_mut() {
+            Some(s) => s,
+            None => return -1,
+        };
+        let handle = match TCP_HANDLE {
+            Some(h) => h,
+            None => return -1,
+        };
+        let socket = sockets.get_mut::<tcp::Socket>(handle);
+        use smoltcp::socket::tcp::State;
+        match socket.state() {
+            State::Established => 1,
+            State::Listen | State::SynReceived | State::SynSent => 0,
+            _ => 0,
+        }
+    }
+}
+
+#[no_mangle]
+pub extern "C" fn rust_net_recv(buf: *mut u8, len: i32) -> i32 {
+    if buf.is_null() || len <= 0 {
+        return -1;
+    }
+    unsafe {
+        let sockets = match SOCKET_SET.as_mut() {
+            Some(s) => s,
+            None => return -1,
+        };
+        let handle = match TCP_HANDLE {
+            Some(h) => h,
+            None => return -1,
+        };
+        let socket = sockets.get_mut::<tcp::Socket>(handle);
+
+        if !socket.may_recv() {
+            return 0;
+        }
+
+        let max_len = len as usize;
+        let mut out_n: i32 = 0;
+
+        let res = socket.recv(|data| {
+            let n = core::cmp::min(data.len(), max_len);
+            if n > 0 {
+                core::ptr::copy_nonoverlapping(data.as_ptr(), buf, n);
+            }
+            out_n = n as i32;
+            // consume n bytes, return n as the closure result
+            (n, ())
+        });
+
+        if res.is_err() {
+            -1
+        } else {
+            out_n
+        }
+    }
+}
+
+#[no_mangle]
+pub extern "C" fn rust_net_send(buf: *const u8, len: i32) -> i32 {
+    if buf.is_null() || len <= 0 {
+        return -1;
+    }
+    unsafe {
+        let sockets = match SOCKET_SET.as_mut() {
+            Some(s) => s,
+            None => return -1,
+        };
+        let handle = match TCP_HANDLE {
+            Some(h) => h,
+            None => return -1,
+        };
+        let socket = sockets.get_mut::<tcp::Socket>(handle);
+
+        // Only send if TCP state/window allows
+        if !socket.may_send() {
+            return 0; // would block / not ready
+        }
+
+        let slice = core::slice::from_raw_parts(buf, len as usize);
+
+        match socket.send_slice(slice) {
+            Ok(n) => n as i32, // actual bytes queued
+            Err(_) => -1,
+        }
+    }
+}
+
+
+#[no_mangle]
+pub extern "C" fn rust_net_close() {
+    unsafe {
+        let sockets = match SOCKET_SET.as_mut() {
+            Some(s) => s,
+            None => return,
+        };
+        let handle = match TCP_HANDLE {
+            Some(h) => h,
+            None => return,
+        };
+        let socket = sockets.get_mut::<tcp::Socket>(handle);
+        socket.close();
+    }
+}
+
+// ---- Panic handler ----
+
+#[panic_handler]
+fn panic(_info: &PanicInfo) -> ! {
+    unsafe {
+        puts_const(b"rust: panic in smoltcp module\n\0");
+    }
+    loop {}
+}
+
+
diff --git a/server.c b/server.c
new file mode 100644
index 0000000..6a82937
--- /dev/null
+++ b/server.c
@@ -0,0 +1,101 @@
+#include "types.h"
+#include "stat.h"
+#include "user.h"
+
+// Returns 1 if request body == "close"
+static int
+body_is_close(char *buf, int n)
+{
+  if(n <= 0) return 0;
+
+  // find "\r\n\r\n" manually
+  int i;
+  for(i = 0; i+3 < n; i++){
+    if(buf[i]   == '\r' &&
+       buf[i+1] == '\n' &&
+       buf[i+2] == '\r' &&
+       buf[i+3] == '\n')
+    {
+      // body begins after the blank line
+      int body_start = i + 4;
+
+      // skip spaces/newlines
+      while(body_start < n &&
+           (buf[body_start] == ' ' ||
+            buf[body_start] == '\n' ||
+            buf[body_start] == '\r'))
+        body_start++;
+
+      // check for "close"
+      if(body_start + 5 <= n &&
+         buf[body_start]   == 'c' &&
+         buf[body_start+1] == 'l' &&
+         buf[body_start+2] == 'o' &&
+         buf[body_start+3] == 's' &&
+         buf[body_start+4] == 'e')
+        return 1;
+
+      return 0; // found body, but not "close"
+    }
+  }
+  return 0; // didn't find end of headers
+}
+
+int
+main(void)
+{
+  for(;;){
+    // Put the TCP socket back into LISTEN state each iteration.
+    // On first iteration the socket is Closed; later it is Closed again
+    // after net_close().
+    if(net_listen(80) < 0){
+      printf(2, "httpd: net_listen(80) failed\n");
+      exit();
+    }
+
+    printf(1, "httpd: listening on port 80\n");
+
+    // Wait until the TCP connection reaches Established
+    while(net_accept() == 0)
+      sleep(10);
+
+    printf(1, "httpd: connection established\n");
+
+    char buf[512];
+    int n = net_recv(buf, sizeof(buf));
+
+    if(n > 0)
+      printf(1, "httpd: received %d bytes\n", n);
+
+    if(body_is_close(buf, n)){
+      // Shutdown reply
+      static const char hdr[] =
+        "HTTP/1.0 200 OK\r\n"
+        "Content-Length: 13\r\n"
+        "Content-Type: text/plain\r\n"
+        "\r\n";
+      static const char body[] = "shutting down\n"; // 13 bytes
+
+      net_send((void*)hdr,  sizeof(hdr)  - 1);
+      net_send((void*)body, sizeof(body) - 1);
+      net_close();
+
+      printf(1, "httpd: close command received, exiting.\n");
+      exit();
+    } else {
+      // Normal reply
+      static const char hdr[] =
+        "HTTP/1.0 200 OK\r\n"
+        "Content-Length: 13\r\n"
+        "Content-Type: text/plain\r\n"
+        "\r\n";
+      static const char body[] = "hi from user\n"; // 13 bytes
+
+      net_send((void*)hdr,  sizeof(hdr)  - 1);
+      net_send((void*)body, sizeof(body) - 1);
+      net_close();
+
+    }
+  }
+}
+
diff --git a/syscall.c b/syscall.c
index ee85261..79b88a0 100644
--- a/syscall.c
+++ b/syscall.c
@@ -103,6 +103,11 @@ extern int sys_unlink(void);
 extern int sys_wait(void);
 extern int sys_write(void);
 extern int sys_uptime(void);
+extern int sys_net_listen(void);
+extern int sys_net_accept(void);
+extern int sys_net_recv(void);
+extern int sys_net_send(void);
+extern int sys_net_close(void);
 
 static int (*syscalls[])(void) = {
 [SYS_fork]    sys_fork,
@@ -126,6 +131,11 @@ static int (*syscalls[])(void) = {
 [SYS_link]    sys_link,
 [SYS_mkdir]   sys_mkdir,
 [SYS_close]   sys_close,
+[SYS_net_listen]  sys_net_listen,
+[SYS_net_accept]  sys_net_accept,
+[SYS_net_recv]    sys_net_recv,
+[SYS_net_send]    sys_net_send,
+[SYS_net_close]   sys_net_close,
 };
 
 void
diff --git a/syscall.h b/syscall.h
index bc5f356..1b1f817 100644
--- a/syscall.h
+++ b/syscall.h
@@ -20,3 +20,8 @@
 #define SYS_link   19
 #define SYS_mkdir  20
 #define SYS_close  21
+#define SYS_net_listen  22
+#define SYS_net_accept  23
+#define SYS_net_recv    24
+#define SYS_net_send    25
+#define SYS_net_close   26
diff --git a/sysnet.c b/sysnet.c
new file mode 100644
index 0000000..cf8cd60
--- /dev/null
+++ b/sysnet.c
@@ -0,0 +1,76 @@
+#include "types.h"
+#include "defs.h"
+#include "param.h"
+#include "mmu.h"
+#include "proc.h"
+#include "syscall.h"
+
+// Rust FFI functions, implemented in lib.rs
+extern int  rust_net_listen(int port);
+extern int  rust_net_accept(void);
+extern int  rust_net_recv(char *buf, int len);
+extern int  rust_net_send(char *buf, int len);
+extern void rust_net_close(void);
+
+// int net_listen(int port);
+int
+sys_net_listen(void)
+{
+  int port;
+  if(argint(0, &port) < 0)
+    return -1;
+  if(port < 0 || port > 65535)
+    return -1;
+  return rust_net_listen(port);
+}
+
+// int net_accept(void);
+// returns 1 if a connection is established, 0 if not yet, -1 on error
+int
+sys_net_accept(void)
+{
+  return rust_net_accept();
+}
+
+// int net_recv(void *buf, int len);
+int
+sys_net_recv(void)
+{
+  int len;
+  char *buf;
+
+  if(argptr(0, &buf, 0) < 0) // size checked below
+    return -1;
+  if(argint(1, &len) < 0)
+    return -1;
+  if(len < 0)
+    return -1;
+
+  return rust_net_recv(buf, len);
+}
+
+// int net_send(void *buf, int len);
+int
+sys_net_send(void)
+{
+  int len;
+  char *buf;
+
+  if(argptr(0, &buf, 0) < 0)
+    return -1;
+  if(argint(1, &len) < 0)
+    return -1;
+  if(len < 0)
+    return -1;
+
+  return rust_net_send(buf, len);
+}
+
+// int net_close(void);
+int
+sys_net_close(void)
+{
+  rust_net_close();
+  return 0;
+}
+
diff --git a/trap.c b/trap.c
index 41c66eb..30f3f6e 100644
--- a/trap.c
+++ b/trap.c
@@ -71,6 +71,10 @@ trap(struct trapframe *tf)
     uartintr();
     lapiceoi();
     break;
+  case T_IRQ0 + IRQ_E1000:
+    e1000_intr();
+    lapiceoi();
+    break;
   case T_IRQ0 + 7:
   case T_IRQ0 + IRQ_SPURIOUS:
     cprintf("cpu%d: spurious interrupt at %x:%x\n",
diff --git a/traps.h b/traps.h
index 0bd1fd8..24cd1a7 100644
--- a/traps.h
+++ b/traps.h
@@ -32,6 +32,7 @@
 #define IRQ_TIMER        0
 #define IRQ_KBD          1
 #define IRQ_COM1         4
+#define IRQ_E1000       11
 #define IRQ_IDE         14
 #define IRQ_ERROR       19
 #define IRQ_SPURIOUS    31
diff --git a/user.h b/user.h
index 4f99c52..c9eb80e 100644
--- a/user.h
+++ b/user.h
@@ -23,6 +23,13 @@ int getpid(void);
 char* sbrk(int);
 int sleep(int);
 int uptime(void);
+// networking
+int  net_listen(int port);           // start listening on TCP port
+int  net_accept(void);              // returns 1 if a connection is established, 0 if not yet, -1 on error
+int  net_recv(void *buf, int n);    // returns bytes read, 0 if no data, -1 on error
+int  net_send(void *buf, int n);    // returns bytes sent, 0 if would-block, -1 on error
+int  net_close(void);               // close current connection
+
 
 // ulib.c
 int stat(const char*, struct stat*);
diff --git a/usys.S b/usys.S
index 8bfd8a1..dd7cca0 100644
--- a/usys.S
+++ b/usys.S
@@ -29,3 +29,8 @@ SYSCALL(getpid)
 SYSCALL(sbrk)
 SYSCALL(sleep)
 SYSCALL(uptime)
+SYSCALL(net_listen)
+SYSCALL(net_accept)
+SYSCALL(net_recv)
+SYSCALL(net_send)
+SYSCALL(net_close)
diff --git a/vm.c b/vm.c
index 7134cff..0275cec 100644
--- a/vm.c
+++ b/vm.c
@@ -57,7 +57,7 @@ walkpgdir(pde_t *pgdir, const void *va, int alloc)
 // Create PTEs for virtual addresses starting at va that refer to
 // physical addresses starting at pa. va and size might not
 // be page-aligned.
-static int
+int
 mappages(pde_t *pgdir, void *va, uint size, uint pa, int perm)
 {
   char *a, *last;
diff --git a/x86.h b/x86.h
index 07312a5..b12314d 100644
--- a/x86.h
+++ b/x86.h
@@ -39,6 +39,21 @@ outsl(int port, const void *addr, int cnt)
                "cc");
 }
 
+static inline void
+outl(ushort port, uint data)
+{
+  asm volatile("outl %0,%1" : : "a" (data), "d" (port));
+}
+
+static inline uint
+inl(ushort port)
+{
+  uint data;
+  asm volatile("inl %1,%0" : "=a" (data) : "d" (port));
+  return data;
+}
+
+
 static inline void
 stosb(void *addr, int data, int cnt)
 {
```
