---
layout: post
title: "Rust Inside xv6"
date: "2025-11-26 10:59:13"
tags: [linux, os, hardware]
description: Writing Rust modules for the x86 xv6 kernel
future: true
---


## Writing a Rust module for the xv6 kernel (x86)
In this short guide I will go over adding Rust "modules" to a base xv6 kernel for the x86 target (although it could be adapted to RISC-V with minimal changes).

While xv6 doesn't really support "modules" in the same way that the Linux kernel does, here I describe a module simply as a subsystem of the kernel that in this case will be completely done in Rust.

### Why?
With this approach you gain memory safety in all the code you abstract to Rust, and only stay unsafe in:

1. The handoff of data from C to Rust and back.
1. MMIO and DMA whenever it's used.

Gaining:

1. No out-of-bounds memory access.
1. No dangling pointers.
1. No double-free.

### Setup

This approach uses:

- A standalone Rust crate (`rustmod/`)
- A static library (`librustmod.a1`)
- CMake glue to build Rust before linking the kernel
- A minimal C → Rust → C FFI interface

### Rust crate

Inside of the root xv6 project, create a `rustmod` crate:

```bash
mkdir rustmod
cd rustmod
cargo init --lib
```

#### Cargo

And make this your `Cargo.toml`:

```toml
[package]
name = "rustmod"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["staticlib"]

[profile.release]
panic = "abort"
lto = true
codegen-units = 1
```

And make this your `.cargo/config.toml`

```toml
[build]
target = "i686-unknown-linux-gnu"

[target.i686-unknown-linux-gnu]
linker = "gcc"
rustflags = [
  "-C", "relocation-model=static",
  "-C", "link-arg=-m32",
  "-C", "target-feature=-mmx,-sse,-sse2,-sse3,-ssse3,-sse4.1,-sse4.2,-avx,-avx2",
  "-C", "soft-float",
]
```
This will make cargo to emit a .a file suitable for linking with the xv6 kernel.

#### Rust

Let's write a basic Rust function to test that everything is working correctly:

`rustmod/src/lib.rs`
```
#![no_std]

use core::panic::PanicInfo;

extern "C" {
    fn c_kputs(msg: *const u8);
}

#[no_mangle]
pub extern "C" fn rust_test() {
    static MSG: &[u8] = b"Rust support loaded\n\0";

    unsafe {
        c_kputs(MSG.as_ptr());
    }
}

#[panic_handler]
fn panic(_info: &PanicInfo) -> ! {
    loop {}
}
```

- `#![no_std]` is required because the kernel provides no standard library.
- `#[no_mangle]` and `extern "C"` ensure ABI compatibility with xv6.
- `panic = "abort"` avoids Rust's complex unwinding.

### C Glue

Inside `kernel/include/defs.h` add:

```c
// external rust
extern void rust_test(void);
```

And in `console.c` add:

```c
void
c_kputs(const char *s)
{
  cprintf("%s", s);
}
```

Finally, in `main()` add the `rust_test();` function:

```c
int
main(void)
{
  ...
  userinit();
  rust_test();
  mpmain();
}
```

### Building & Linking

The xv6 kernel is built using `kernel/CMakeLists.txt`. This file has to be modified such that it:

- Builds the Rust crate via a custom target.
- Links the resulting static library into the kernel ELF.
- Adds correct dependencies so Rust always builds before the kernel.

#### Building Rust target in CMake

Add this to `kernel/CMakeLists.txt`

```makefile
# Path to the rust staticlib
set(RUSTMOD_DIR ${CMAKE_SOURCE_DIR}/rustmod)
set(RUSTMOD_TARGET i686-unknown-linux-gnu)
set(RUSTMOD_LIB ${RUSTMOD_DIR}/target/${RUSTMOD_TARGET}/release/librustmod.a)

# Build the Rust kernel module with cargo
add_custom_target(rustmod_build
    COMMAND cargo build --release
    WORKING_DIRECTORY ${RUSTMOD_DIR}
    BYPRODUCTS ${RUSTMOD_LIB}
    COMMENT "Building Rust kernel module"
)
```

Which defines:

```bash
cargo build --release --target i686-unknown-linux-gnu
```

To output `librustmod.a`.

#### Linking into xv6 kernel

Find wherever you're linking the kernel and all kernel objects:

```makefile
COMMAND ld -m elf_i386 -nostdlib -T kernel.ld ...
        ${kernel_OBJECTS} -b binary initcode entryother
```

And change it with:

```makefile
COMMAND ld -m elf_i386 -nostdlib -T ${CMAKE_CURRENT_SOURCE_DIR}/kernel.ld -o kernel
        ${kernel_OBJECTS} ${RUSTMOD_LIB} -b binary initcode entryother
DEPENDS
        ...
        rustmod_build
```

## Testing Functionality

Finally, when building and starting xv6, you should see:

```shell
SeaBIOS (version 1.15.0-1)


iPXE (https://ipxe.org) 00:03.0 CA00 PCI2.10 PnP PMM+1FF8B4A0+1FECB4A0 CA00



Booting from Hard Disk..xv6...
Rust support loaded.             <-- From Rust!
cpu0: starting 0
sb: size 20000 nblocks 19937 ninodes 200 nlog 30 logstart 2 inodestart 32 bmap start 58
init: starting sh
$ ls
.              1 1 512
..             1 1 512
init           2 2 46876
README         2 3 2170
sh             2 4 54604
ls             2 5 48684
cat            2 6 47016
rm             2 7 46448
test_sha256    2 8 48236
test_aes256    2 9 47872
console        3 10 0
$
```
