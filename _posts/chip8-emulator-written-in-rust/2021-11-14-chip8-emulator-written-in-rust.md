---
layout: post
title: "🎮 Building a CHIP-8 Emulator in Rust"
tags: [coding, rust, software, opensource]
date: 2023-08-15 18:53 -0400
usemathjax: true
toc: true
---

In this brief writeup, I'll show you how I wrote my first emulator--an emulator to the CHIP-8 programming language--in Rust.

# Introduction

This post isn't supposed to be a step-to-step guide, it may be treated as such, but you will probably find some better guides on the internet. I wrote this emulator a while ago and am just now(~1.5 years later) writing this post, so don't lynch me for my errors--or better yet; fix them on [github](https://github.com/Ferryistaken/CHIP8-rs/issues).

# Project setup

# CHIP8

## CHIP8 Description

### 16 8-bit registers

Registers are small storage locations in the CPU for temporary data storage and operations.

```rust
let mut registers: [u8; 16] = [0; 16]; // Registers V0 to VF
```

### 4k bytes of memory

Memory is the larger storage used for program instructions, long-term data, and short-term data.

```rust
let mut memory: [u8; 4096] = [0; 4096];
```

### 16-bit index registers

The Index Register holds memory addresses for certain operations.

```rust
let mut index_register: u16 = 0;
```

### 16-bit program counter

The Program Counter keeps track of the address for the next instruction to execute.

```rust
let mut program_counter: u16 = 0x200; // The program starts at 0x200
```

### 16-level stack

The stack keeps track of return addresses when calling into functions.

```rust
let mut stack: [u16; 16] = [0; 16];
```

### 8-bit stack pointer

The Stack Pointer points to the top-most level of the stack.

```rust
let mut stack_pointer: u8 = 0;
```

### 8-bit delay timer

The delay timer in CHIP-8 decrements at a rate of 60Hz until it reaches zero.

```rust
// 8-bit delay timer
let mut delay_timer: u8 = 0;
```

### 8-bit sound timer

When the sound timer is set to a value greater than zero, a beep is produced and it decrements at a rate of 60Hz until it reaches zero.

```rust
// 8-bit sound timer
let mut sound_timer: u8 = 0;
```

### 16 input keys

CHIP-8 has 16 input keys, typically represented by the hexadecimal numbers 0 through F.

```rust
// Keys 0x0 through 0xF.
let mut keypad: [u8; 16] = [0; 16];
```

### 64x32 monochrome display memory
CHIP-8 has a monochrome display of 64x32 pixels.

```rust
// Display, 64x32.
let mut video: [u32; 64 * 32] = [0; 64 * 32];
```

### Implementation Specific Variables

#### Opcode Function Tables

For a CHIP-8 emulator, using function tables is a common and efficient way to handle opcodes. By mapping each opcode to a specific function that implements it, you can avoid a large switch or match statement.

```rust
// Main opcode table
let mut table: [fn(&mut Chip8); 0xF+1] = [Chip8::OP_ERR; 0xF+1];

// Sub-tables for opcodes that begin with 0, 8, E, and F
let mut table0: [fn(&mut Chip8); 0xE+1] = [Chip8::OP_ERR; 0xE+1];
let mut table8: [fn(&mut Chip8); 0xE+1] = [Chip8::OP_ERR; 0xE+1];
let mut tableE: [fn(&mut Chip8); 0xE+1] = [Chip8::OP_ERR; 0xE+1];
let mut tableF: [fn(&mut Chip8); 0x65+1] = [Chip8::OP_ERR; 0x65+1];
```
<br>

- `table`: This is the primary opcode table. Each index of this array corresponds to the first half-byte (nibble) of an opcode. For example, any opcode that starts with '8' (like 8xy0, 8xy1, etc.) would be found at table[8].
- `table0`: This is a sub-table for opcodes that begin with '0'. It helps differentiate between instructions like 00E0 and 00EE.
- `table8`: A sub-table for opcodes that start with '8'. As the CHIP-8 has multiple instructions starting with '8', this table distinguishes between them based on the last nibble.
- `tableE`: Similarly, this table is for opcodes that begin with 'E', allowing for differentiation between instructions like ExA1 and Ex9E.
- `tableF`: This table handles a range of opcodes that start with 'F', with their differentiation based on the second byte of the opcode.

The `add_table` (shown below) function initializes these tables by associating each opcode with its respective function (or method). For instance, the opcode 8xy1 (OR operation between Vx and Vy) would be assigned to the Chip8::OP_8xy1 function.

### Class Members

```rust
pub struct Chip8 {
    registers: [u8; 16],
    memory: [u8; 4096],
    index_register: u16,
    program_counter: u16,
    stack: [u16; 16],
    stack_pointer: u8,
    delay_timer: u8,
    sound_timer: u8,
    keypad: [u8; 16],
    pub video: [u32; 64 * 32],
    op_code: u16,
    table: [fn(&mut Chip8); 0xF+1],
    table0: [fn(&mut Chip8); 0xE+1],
    table8: [fn(&mut Chip8); 0xE+1],
    tableE: [fn(&mut Chip8); 0xE+1],
    tableF: [fn(&mut Chip8); 0x65+1],
    debug_mode: bool,
}
```

# Loading a ROM

In a CHIP-8 emulator, the most crucial task after initializing the system is loading a ROM (Read Only Memory) that contains the game or program we want to run. Let's delve into how the load_rom function works.


```rust
/// Loads a given rom into memory, starting from memory address 0x200
pub fn load_rom(&mut self, path: PathBuf) {
```

**Purpose**:
This function is designed to load a provided ROM file into the emulator's memory. It expects a PathBuf which is the path to the ROM file you want to load.



```rust
let start_address = 0x200;
```

**Start Address**:
In the CHIP-8 system, the memory address 0x200 is the conventional starting point for most ROMs. The memory before this address is typically reserved for the system's use, like the CHIP-8 interpreter itself and the font set.

```rust
let mut buf: Vec<u8> = Vec::new();
```

**Byte Buffer**:
The buf vector will temporarily store the bytes read from the ROM file. It's initialized as an empty vector of bytes (u8).

```rust
for byte in file.bytes() {
    let byte = match byte {
        Ok(byte) => byte,
        Err(error) => panic!("Provided rom is not a valid binary. {:?}", error),
    };
    buf.push(byte);
}
```

**Reading the ROM**:
I then iterate over each byte in the ROM file. If a byte is successfully read, it's added to the buf vector. However, if there's any error while reading, the program will panic and provide an error message indicating that the ROM might not be a valid binary.


```rust
for i in 0..buf.len() {
    self.memory[start_address + i] = buf[i];
}
```

**Loading into CHIP-8 Memory**:
Once the ROM's bytes are stored in the buffer, I proceed to load each byte into the CHIP-8's memory, starting from the start_address (0x200). This loop efficiently transfers the program from our buffer to the emulator's memory.

```rust
if (self.debug_mode) {
    eprintln!("ROM Loaded");
}
```

**Completion Message**:
Finally, if the debug_mode is enabled, a message indicating the successful loading of the ROM will be printed.

In conclusion, the load_rom function is essential for the emulator's operation, ensuring that the game or program ROM is correctly loaded into memory and ready for execution.

# Printing the Video Buffer


```rust
pub fn pretty_print_video(&mut self) {
```

**Purpose**:
This function's primary role is to render the video buffer of the CHIP-8 emulator in a more visually-pleasing manner on the console.


```rust
print!("\x1B[2J\x1B[1;1H");
```

**Console Clear and Reset**:
This line employs ANSI escape codes to clear the console and move the cursor to the top-left position. This is done so that each frame from the video buffer is drawn on a fresh screen, preventing overlap and ensuring clarity.

```rust
let mut new_vec = self.video.iter().peekable();
let mut rows: Vec<Vec<_>> = vec![];
```

**Initialization**:
We first convert the video buffer into an iterator that also supports the peek method. We also create an empty rows vector that will later store the video data in row-wise chunks.

```rust
while new_vec.peek().is_some() {
    let chunk: Vec<_> = new_vec.by_ref().take(64).collect();
    rows.push(chunk);
}
```

**Chunking Video Buffer**:
CHIP-8 has a resolution of 64x32 pixels. Here, we take the linear video buffer and split it into rows of 64 pixels each. These rows are stored in the rows vector, making it easier to print them line by line.

```rust
for row in rows {
    let mut current_row = "".to_string();
```

**Iterating Over Rows**:
For each row in our rows vector, we initiate an empty string current_row that will represent the current line of pixels.

```rust
for pixel in row {
    if (pixel == &(0xFFFFFFFF as u32)) {
        current_row.push('█');
    } else {
        current_row.push(' ');
    }
}
```

**Pixel Representation**:
For each pixel in the row, we check its value. If the pixel's value is 0xFFFFFFFF (which typically represents a white or "on" pixel in CHIP-8), we append a '█' character to the current_row string. This character provides a filled visual representation. If the pixel is not 'on', we append a space to represent the "off" state.

```rust
println!("{}", current_row);
```

**Printing the Row**:
Lastly, we print out the constructed current_row string. This process is repeated for all rows, thus rendering the entire frame from the video buffer.

# Loading the Characters

```rust
fn load_fonts(&mut self) {
```

**Purpose**:
This function is designed to load the CHIP-8's built-in fontset into the emulator's memory. This fontset contains graphical representations for the hexadecimal numbers 0 through F.

```rust
let fontset: [u8; 80] = [
            0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
            0x20, 0x60, 0x20, 0x20, 0x70, // 1
            0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
            0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3
            0x90, 0x90, 0xF0, 0x10, 0x10, // 4
            0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
            0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
            0xF0, 0x10, 0x20, 0x40, 0x40, // 7
            0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
            0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
            0xF0, 0x90, 0xF0, 0x90, 0x90, // A
            0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
            0xF0, 0x80, 0x80, 0x80, 0xF0, // C
            0xE0, 0x90, 0x90, 0x90, 0xE0, // D
            0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
            0xF0, 0x80, 0xF0, 0x80, 0x80, // F];
        ];
```

**Fontset Declaration**:
The fontset array contains the binary representations of the 16 characters (0-F) used in CHIP-8. Each character is 5 bytes long and can be rendered on a 4x5 pixel grid.

```rust
let fontset_start_address = 0x50;
```

**Fontset Memory Location**:
The fontset is loaded into a predefined starting address in memory, which is 0x50 or 80 in decimal. This is the standard location for the fontset in a typical CHIP-8 implementation.

```rust
if (self.debug_mode) {
    eprintln!("Loading fontset");
}
```

**Debug Mode Check**:
If the emulator is running in debug mode, it will print a message to the console indicating that the fontset loading process has begun.

```rust
for i in 0..fontset.len() {
    self.memory[fontset_start_address + i as usize] = fontset[i as usize];
}
```

**Loading the Fontset into Memory**:
This loop iterates through every byte in the fontset array and places each byte into the corresponding location in the emulator's memory. It starts at fontset_start_address and continues until the entire fontset is loaded.

# The Instructions

**OP_00E0 - Clear Screen**
This opcode clears the screen by setting all pixels in the video buffer to zero.

```rust
    pub fn OP_00E0(&mut self) {
        // set video buffer to zero
        self.video = [0; 2048];
        if self.debug_mode {
            eprintln!("Ran opcode: {}", function_name!());
        }
    }
```

**OP_00EE - Return from subroutine**
This opcode handles the end of a subroutine call. It decrements the stack pointer and sets the program counter back to the address at the top of the stack, effectively returning to where the subroutine was called.

```rust
    fn OP_00EE(&mut self) {
        self.stack_pointer = self.stack_pointer - 1;

        self.program_counter = self.stack[self.stack_pointer as usize];
        if self.debug_mode {
            eprintln!("Ran opcode: {}", function_name!());
        }
    }
```

**OP_1nnn - Jump to location NNN**
This opcode sets the program counter directly to the address NNN, effectively making the program jump to this new address.

```rust
    fn OP_1nnn(&mut self) {
        // using 0x0FFF I can take the NNN from the opcode while leaving the one
        let address: u16 = self.op_code & 0x0FFF;

        self.program_counter = address;
        if self.debug_mode {
            eprintln!("Ran opcode: {}", function_name!());
        }
    }
```

**OP_2nnn - Call subroutine at location NNN**
This opcode calls a subroutine. The current program counter is saved to the stack, then the stack pointer is incremented, and the program counter is set to the address NNN.

```rust
    fn OP_2nnn(&mut self) {
        let address: u16 = self.op_code & 0x0FFF;

        self.stack[self.stack_pointer as usize] = self.program_counter;
        self.stack_pointer = self.stack_pointer + 1;
        self.program_counter = address;
        if self.debug_mode {
            eprintln!("Ran opcode: {}", function_name!());
        }
    }
```

**OP_3xkk - Skip next instruction if Vx = kk**
This opcode checks if register Vx contains the value kk. If true, it skips the next instruction by incrementing the program counter by 2.

```rust
    fn OP_3xkk(&mut self) {
        let Vx: u16 = (self.op_code & 0x0F00).checked_shr(8).unwrap_or(0);
        let byte: u16 = self.op_code & 0x00FF;

        let byte: u8 = match u8::try_from(byte) {
            Ok(number) => number,
            Err(error) => panic!(
                "Could not turn u16 into u8 in OPCODE: 3XKK. Error: {}",
                error
            ),
        };

        if self.registers[Vx as usize] == byte {
            self.program_counter += 2;
        }
        if self.debug_mode {
            eprintln!("Ran opcode: {}", function_name!());
        }
    }
```

**OP_4xkk - Skip next instruction if Vx != kk**
Similar to the opcode above, but this opcode checks if register Vx does not contain the value kk. If true, it skips the next instruction.

```rust
    fn OP_4xkk(&mut self) {
        let Vx: u16 = (self.op_code & 0x0F00).checked_shr(8).unwrap_or(0);
        let byte: u16 = self.op_code & 0x00FF;

        let byte: u8 = match u8::try_from(byte) {
            Ok(number) => number,
            Err(error) => panic!(
                "Could not turn u16 into u8 in OPCODE: 3XKK. Error: {}",
                error
            ),
        };

        // this != is the only difference from the function above
        if self.registers[Vx as usize] != byte {
            self.program_counter += 2;
        }
        if self.debug_mode {
            eprintln!("Ran opcode: {}", function_name!());
        }
    }
```

**OP_5xy0 - Skip next instruction if Vx = Vy**
This opcode compares the values of two registers, Vx and Vy. If their values are equal, the next instruction is skipped.

```rust
    fn OP_5xy0(&mut self) {
        let Vx: u16 = (self.op_code & 0x0F00).checked_shr(8).unwrap_or(0);
        let Vy: u16 = (self.op_code & 0x00F0).checked_shr(4).unwrap_or(0);

        if self.registers[Vx as usize] == self.registers[Vy as usize] {
            self.program_counter += 2;
        }
        if self.debug_mode {
            eprintln!("Ran opcode: {}", function_name!());
        }
    }
```

**OP_6xkk - Set Vx = kk**
This opcode directly sets the value of register Vx to kk.

```rust
    fn OP_6xkk(&mut self) {
        let Vx: u16 = (self.op_code & 0x0F00).checked_shr(8).unwrap_or(0);
        let byte: u16 = self.op_code & 0x00FF;

        let byte: u8 = match u8::try_from(byte) {
            Ok(number) => number,
            Err(error) => panic!(
                "Could not turn u16 into u8 in OPCODE 6XKK. Error: {}",
                error
            ),
        };

        self.registers[Vx as usize] = byte;
        if self.debug_mode {
            eprintln!("Ran opcode: {}", function_name!());
        }

    }
```

**OP_7xkk - Set Vx = Vx + kk**
This opcode adds the value kk to register Vx and then stores the result back into Vx. If there's an overflow, it wraps around.

```rust
    fn OP_7xkk(&mut self) {
        let Vx: u16 = (self.op_code & 0x0F00).checked_shr(8).unwrap_or(0);
        let byte: u8 = (self.op_code as u8) & 0x00FF;

        self.registers[Vx as usize] = (((self.registers[Vx as usize] as u16) + byte as u16) % 256) as u8;

        if self.debug_mode {
            eprintln!("Ran opcode: {}", function_name!());
        }
    }
```

**OP_8xy0 - Set Vx = Vy**
This opcode copies the value from register Vy to register Vx.

```rust
    fn OP_8xy0(&mut self) {
        let Vx: u16 = (self.op_code & 0x0F00).checked_shr(8).unwrap_or(0);
        let Vy: u16 = (self.op_code & 0x00F0).checked_shr(4).unwrap_or(0);

        self.registers[Vx as usize] = self.registers[Vy as usize];
        if self.debug_mode {
            eprintln!("Ran opcode: {}", function_name!());
        }
    }
```

**OP_8xy1 - Set Vx = Vx OR Vy**
This opcode performs a bitwise OR operation between the values in registers Vx and Vy, then stores the result back into Vx.

```rust
    fn OP_8xy1(&mut self) {
        let Vx: u16 = (self.op_code & 0x0F00).checked_shr(8).unwrap_or(0);
        let Vy: u16 = (self.op_code & 0x00F0).checked_shr(4).unwrap_or(0);

        self.registers[Vx as usize] |= self.registers[Vy as usize];
        if self.debug_mode {
            eprintln!("Ran opcode: {}", function_name!());
        }
    }
```

**OP_8xy2** - Set Vx = Vx AND Vy

Functionality: Bitwise AND of Vx and Vy.
Implementation Details: The values of registers Vx and Vy are obtained from the opcode. The value at register Vx is then bitwise AND-ed with the value at register Vy, and the result is stored back in Vx.

```rust
    fn OP_8xy2(&mut self) {
        let Vx: u16 = (self.op_code & 0x0F00).checked_shr(8).unwrap_or(0);
        let Vy: u16 = (self.op_code & 0x00F0).checked_shr(4).unwrap_or(0);

        self.registers[Vx as usize] &= self.registers[Vy as usize];
        if self.debug_mode {
            eprintln!("Ran opcode: {}", function_name!());
        }
    }
```

**OP_8xy3** - Set Vx = Vx XOR Vy

Functionality: Bitwise XOR of Vx and Vy.
Implementation Details: The values of registers Vx and Vy are obtained from the opcode. The value at register Vx is then bitwise XOR-ed with the value at register Vy, and the result is stored back in Vx.

```rust
    fn OP_8xy3(&mut self) {
        let Vx: u16 = (self.op_code & 0x0F00).checked_shr(8).unwrap_or(0);
        let Vy: u16 = (self.op_code & 0x00F0).checked_shr(4).unwrap_or(0);

        self.registers[Vx as usize] ^= self.registers[Vy as usize];
        if self.debug_mode {
            eprintln!("Ran opcode: {}", function_name!());
        }
    }
```

**OP_8xy4** - Set Vx = Vx + Vy, set VF = carry.

Functionality: Adds Vx and Vy. Checks for an overflow.
Implementation Details: If the result exceeds 255, the VF register is set to 1 (indicating a carry). Otherwise, it's set to 0. Only the lowest 8 bits of the result are kept and stored back in Vx.

```rust
    fn OP_8xy4(&mut self) {
        let Vx: u16 = (self.op_code & 0x0F00).checked_shr(8).unwrap_or(0);
        let Vy: u16 = (self.op_code & 0x00F0).checked_shr(4).unwrap_or(0);

        let sum: u16 = self.registers[Vx as usize] as u16 + self.registers[Vy as usize] as u16;

        if sum > 255 {
            self.registers[0xF] = 1;
        } else {
            self.registers[0xF] = 0;
        }

        self.registers[Vx as usize] = (sum & 0xFF) as u8;
        if self.debug_mode {
            eprintln!("Ran opcode: {}", function_name!());
        }
    }
```

**OP_8xy5** - Set Vx = Vx - Vy, set VF = NOT borrow.

Functionality: Subtracts Vy from Vx. Checks if there's a borrow.
Implementation Details: If Vx > Vy, VF is set to 1 (no borrow). If Vy > Vx, VF is set to 0 (indicates a borrow). The result of the subtraction is then stored back in Vx.

```rust
    fn OP_8xy5(&mut self) {
        let Vx: u16 = (self.op_code & 0x0F00).checked_shr(8).unwrap_or(0);
        let Vy: u16 = (self.op_code & 0x00F0).checked_shr(4).unwrap_or(0);

        if self.registers[Vx as usize] > self.registers[Vy as usize] {
            self.registers[0xF] = 1;
        } else {
            self.registers[0xF] = 0;
        }


        self.registers[Vx as usize] = self.registers[Vx as usize].wrapping_sub(self.registers[Vy as usize]);

        if self.debug_mode {
            eprintln!("Ran opcode: {}", function_name!());
        }
    }
```

**OP_8xy6** - Set Vx = Vx SHR 1.

Functionality: Bitwise shift right of Vx.
Implementation Details: If the least-significant bit of Vx is 1, then VF is set to 1; otherwise, it's 0. The value in Vx is then halved (shifted right by one bit).

```rust
    fn OP_8xy6(&mut self) {
        let Vx: u16 = (self.op_code & 0x0F00).checked_shr(8).unwrap_or(0);

        // Save LSB in VF
        self.registers[0xF] = self.registers[Vx as usize] & 0x1;

        self.registers[Vx as usize].shr_assign(1);
        if self.debug_mode {
            eprintln!("Ran opcode: {}", function_name!());
        }
    }
```

**OP_8xy7** - SUBN Vx, Vy

Functionality: Subtract Vx from Vy.
Implementation Details: If Vy > Vx, VF is set to 1 (no borrow). If Vx > Vy, VF is set to 0 (indicates a borrow). The result of Vy - Vx is then stored back in Vx.

```rust
    fn OP_8xy7(&mut self) {
        let Vx: u16 = (self.op_code & 0x0F00).checked_shr(8).unwrap_or(0);
        let Vy: u16 = (self.op_code & 0x00F0).checked_shr(4).unwrap_or(0);

        if self.registers[Vy as usize] > self.registers[Vx as usize] {
            self.registers[0xF] = 1;
        } else {
            self.registers[0xF] = 0;
        }

        //self.registers[Vx as usize] = self.registers[Vy as usize] - self.registers[Vx as usize];
        self.registers[Vx as usize] = self.registers[Vy as usize].wrapping_sub(self.registers[Vx as usize]);

        if self.debug_mode {
            eprintln!("Ran opcode: {}", function_name!());
        }
    }
```

**OP_8xyE** - Set Vx = Vx SHL 1.

Functionality: Bitwise shift left of Vx.
Implementation Details: If the most-significant bit of Vx is 1, then VF is set to 1; otherwise, it's 0. The value in Vx is then doubled (shifted left by one bit).

```rust
    fn OP_8xyE(&mut self) {
        let Vx: u16 = (self.op_code & 0x0F00).checked_shr(8).unwrap_or(0);

        // save MSB in VF
        self.registers[0xF] = (self.registers[Vx as usize] & 0x80).checked_shr(7).unwrap_or(0);

        self.registers[Vx as usize].shl_assign(1);
        if self.debug_mode {
            eprintln!("Ran opcode: {}", function_name!());
        }
    }
```

**OP_9xy0** - Skip next instruction if Vx != Vy

Functionality: Conditional instruction skipping.
Implementation Details: If the values in registers Vx and Vy are not equal, the program counter is increased by 2, effectively skipping the next instruction.

```rust
    fn OP_9xy0(&mut self) {
        let Vx: u16 = (self.op_code & 0x0F00).checked_shr(8).unwrap_or(0);
        let Vy: u16 = (self.op_code & 0x00F0).checked_shr(4).unwrap_or(0);

        if self.registers[Vx as usize] != self.registers[Vy as usize] {
            self.program_counter += 2;
        }
        if self.debug_mode {
            eprintln!("Ran opcode: {}", function_name!());
        }
    }
```

**OP_Annn** - set I = nnn

Functionality: Sets the index register to the value nnn from the opcode.
Implementation Details: The value nnn from the opcode is directly assigned to the index register.

```rust
    fn OP_Annn(&mut self) {
        let address: u16 = self.op_code & 0x0FFF;

        self.index_register = address;
        if self.debug_mode {
            eprintln!("Ran opcode: {}", function_name!());
        }
    }
```

**OP_Bnnn** - Jump to location nnn + V0

Functionality: Sets the program counter to the address nnn + the value in register V0.
Implementation Details: The program counter is adjusted to the new address computed as the sum of nnn and the value in register V0.

```rust
    fn OP_Bnnn(&mut self) {
        let address: u16 = self.op_code & 0x0FFF;

        self.program_counter = self.registers[0] as u16 + address;
        if self.debug_mode {
            eprintln!("Ran opcode: {}", function_name!());
        }
    }
```

**OP_Cxkk** - Set Vx = random byte AND kk.

Functionality: Sets Vx to the result of a bitwise AND operation between a random byte and kk.
Implementation Details: A random byte is generated and bitwise AND-ed with the value kk. The result is then stored in register Vx.

```rust
    fn OP_Cxkk(&mut self) {
        let Vx: u16 = (self.op_code & 0x0F00).checked_shr(8).unwrap_or(0);
        let byte: u16 = self.op_code & 0x00FF;

        let byte: u8 = match u8::try_from(byte) {
            Ok(number) => number,
            Err(error) => panic!(
                "Could not turn u16 into u8 in OPCODE CXKK. Error: {}",
                error
            ),
        };

        self.registers[Vx as usize] = self.rand_byte() & byte;
        if self.debug_mode {
            eprintln!("Ran opcode: {}", function_name!());
        }
    }
```

**OP_Dxyn** - Display n-byte sprite starting at memory location I at (Vx, Vy), set VF = collision.

Functionality: Draws a sprite on the display.
Implementation Details: The sprite data starts at the memory location pointed to by the index register. The sprite is drawn at coordinates (Vx, Vy) and has a height of n bytes. If a sprite pixel collides with an existing pixel on the screen, VF is set to 1.

```rust
    fn OP_Dxyn(&mut self) {
        let Vx = (self.op_code & 0x0F00).checked_shr(8).unwrap_or(0);
        let Vy = (self.op_code & 0x00F0).checked_shr(4).unwrap_or(0);
        let height = self.op_code & 0x000F;
        let VIDEO_WIDTH: u8 = 64;
        let VIDEO_HEIGHT: u8 = 32;

        // wrap if going over boundaries
        let x_pos: u8 = self.registers[Vx as usize] % VIDEO_WIDTH;
        let y_pos: u8 = self.registers[Vy as usize] % VIDEO_HEIGHT;

        self.registers[0xF] = 0;

        for row in 0..height {
            let sprite_byte: u8 = self.memory[(self.index_register + row) as usize];

            for col in 0..8 {
                let sprite_pixel = sprite_byte & ((0x80 as u16).checked_shr(col as u32).unwrap_or(0) as u8);
                // casting without error checking here is fine because col and raw wil alwyays be lower than 255(they are 64 and 32)
                //let mut screen_pixel = self.video[(((y_pos as u16 + row) * (VIDEO_WIDTH as u16) + (x_pos as u16) + col)) as usize];

                // TODO: Fix this, sometimes the index is out of bounds because rust doesn't wrap,
                // so all subtractions and all additions should be wrapping_sub() and wrapping_add()
                // instead of normal + and -.
                let video_index = ((y_pos as u16 + row) * (VIDEO_WIDTH as u16) + (x_pos as u16) + col) as usize;

                // sprite pixel is on
                if sprite_pixel != 0 {
                    // screen pixel also on - collision
                    if self.video[video_index] == 0xFFFFFFFF {
                        self.registers[0xF] = 1;
                    }

                    // Effectively XOR with the sprite pixel
                    self.video[video_index] ^= 0xFFFFFFFF;
                }
            }
        }
        if self.debug_mode {
            eprintln!("Ran opcode: {}", function_name!());
        }
    }
```

**OP_Ex9E** - Skip next instruction if key with the value of Vx is pressed.

Functionality: Conditional instruction skipping based on key press.
Implementation Details: If the key corresponding to the value in register Vx is currently pressed, the program counter is increased by 2, effectively skipping the next instruction.

```rust
    fn OP_Ex9E(&mut self) {
        let Vx: u16 = (self.op_code & 0x0F00).checked_shr(8).unwrap_or(0);
        let key: u8 = self.registers[Vx as usize];

        if self.keypad[key as usize] != 0 {
            self.program_counter += 2;
        }
        if self.debug_mode {
            eprintln!("Ran opcode: {}", function_name!());
        }
    }
```

**OP_ExA1** - Skip next instruction if key with the value of Vx is not pressed.

Functionality: Conditional instruction skipping based on key release.
Implementation Details: If the key corresponding to the value in register Vx is currently not pressed, the program counter is increased by 2, effectively skipping the next instruction.

```rust
    fn OP_ExA1(&mut self) {
        let Vx: u16 = (self.op_code & 0x0F00).checked_shr(8).unwrap_or(0);
        let key: u8 = self.registers[Vx as usize];

        if self.keypad[key as usize] == 0 {
            self.program_counter += 2;
        }
        if self.debug_mode {
            eprintln!("Ran opcode: {}", function_name!());
        }
    }
```

**OP_Fx07** - Set Vx = delay timer value
Functionality: Sets register Vx to the value of the delay timer.
Implementation Details: Vx is extracted from the opcode, and its value is set to the current value of the delay timer.

```rust
    fn OP_Fx07(&mut self) {
        let Vx: u16 = (self.op_code & 0x0F00).checked_shr(8).unwrap_or(0);

        self.registers[Vx as usize] = self.delay_timer;
        if self.debug_mode {
            eprintln!("Ran opcode: {}", function_name!());
        }
    }
```

**OP_Fx0A** - Wait for a key press, store the value of the key in Vx
Functionality: Halts execution until a key press is detected, then stores the key value in Vx.
Implementation Details: The function checks each key in the keypad array. If a key is pressed (has a non-zero value), the corresponding key value is stored in Vx. If no keys are pressed, the program counter is decremented by 2, effectively halting the program and rerunning the same opcode until a key is pressed.

```rust
    fn OP_Fx0A(&mut self) {
        let Vx: u16 = (self.op_code & 0x0F00).checked_shr(8).unwrap_or(0);

        if self.keypad[0] != 0 {
            self.registers[Vx as usize] = 0;
        } else if self.keypad[1] != 0 {
            self.registers[Vx as usize] = 1;
        } else if self.keypad[2] != 0 {
            self.registers[Vx as usize] = 2;
        } else if self.keypad[3] != 0 {
            self.registers[Vx as usize] = 3;
        } else if self.keypad[4] != 0 {
            self.registers[Vx as usize] = 4;
        } else if self.keypad[5] != 0 {
            self.registers[Vx as usize] = 5;
        } else if self.keypad[6] != 0 {
            self.registers[Vx as usize] = 6;
        } else if self.keypad[7] != 0 {
            self.registers[Vx as usize] = 7;
        } else if self.keypad[8] != 0 {
            self.registers[Vx as usize] = 8;
        } else if self.keypad[9] != 0 {
            self.registers[Vx as usize] = 9;
        } else if self.keypad[10] != 0 {
            self.registers[Vx as usize] = 10;
        } else if self.keypad[11] != 0 {
            self.registers[Vx as usize] = 11;
        } else if self.keypad[12] != 0 {
            self.registers[Vx as usize] = 12;
        } else if self.keypad[13] != 0 {
            self.registers[Vx as usize] = 13;
        } else if self.keypad[14] != 0 {
            self.registers[Vx as usize] = 14;
        } else if self.keypad[15] != 0 {
            self.registers[Vx as usize] = 15;
        } else {
            self.program_counter -= 2;
        }
        if self.debug_mode {
            eprintln!("Ran opcode: {}", function_name!());
        }
    }
```

**OP_Fx15** - Set delay timer = Vx
Functionality: Sets the delay timer to the value in Vx.
Implementation Details: Vx is extracted from the opcode, and the delay timer's value is set to the value in Vx.

```rust
    fn OP_Fx15(&mut self) {
        let Vx: u16 = (self.op_code & 0x0F00).checked_shr(8).unwrap_or(0);

        self.delay_timer = self.registers[Vx as usize];
        if self.debug_mode {
            eprintln!("Ran opcode: {}", function_name!());
        }
    }
```

**OP_Fx18** - Set sound timer = Vx
Functionality: Sets the sound timer to the value in Vx.
Implementation Details: Vx is extracted from the opcode, and the sound timer's value is set to the value in Vx.

```rust
    fn OP_Fx18(&mut self) {
        let Vx: u16 = (self.op_code & 0x0F00).checked_shr(8).unwrap_or(0);

        self.sound_timer = self.registers[Vx as usize];
        if self.debug_mode {
            eprintln!("Ran opcode: {}", function_name!());
        }
    }
```

**OP_Fx1E** - Set I = I + Vx
Functionality: Increments the index register I by the value in Vx.
Implementation Details: Vx is extracted from the opcode, and the index register's value is increased by the value in Vx.

```rust
    fn OP_Fx1E(&mut self) {
        let Vx: u16 = (self.op_code & 0x0F00).checked_shr(8).unwrap_or(0);

        self.index_register += self.registers[Vx as usize] as u16;
        if self.debug_mode {
            eprintln!("Ran opcode: {}", function_name!());
        }
    }
```

**OP_Fx29** - Set I = location of sprite for digit Vx
Functionality: Sets I to the starting address of the sprite data for a given digit in Vx.
Implementation Details: The function calculates the starting address of the sprite (5 bytes per sprite) and assigns it to the index register.

```rust
    fn OP_Fx29(&mut self) {
        let Vx: u16 = (self.op_code & 0x0F00).checked_shr(8).unwrap_or(0);
        let digit = self.registers[Vx as usize];
        let fontset_start_address = 0x50;

        self.index_register = (fontset_start_address + (5*digit)) as u16;
        if self.debug_mode {
            eprintln!("Ran opcode: {}", function_name!());
        }
    }
```

**OP_Fx33** - Store BCD representation of Vx in memory locations I, I+1, and I+2
Functionality: Converts Vx into its BCD (Binary-Coded Decimal) representation and stores the digits in memory.
Implementation Details: Vx is extracted and broken down into its ones, tens, and hundreds digits. These are then stored in consecutive memory locations starting at I.

```rust
    fn OP_Fx33(&mut self) {
        let Vx: u16 = (self.op_code & 0x0F00).checked_shr(8).unwrap_or(0);
        let mut value: u8 = self.registers[Vx as usize];

        // ones place
        self.memory[(self.index_register + 2) as usize] = value % 10;
        value /= 10;

        // tens place
        self.memory[(self.index_register + 1) as usize] = value % 10;
        value /= 10;

        // hundreds place
        self.memory[self.index_register as usize] = value % 10;
        if self.debug_mode {
            eprintln!("Ran opcode: {}", function_name!());
        }
    }
```

**OP_Fx55** - Store registers V0 to VX in memory starting at location I
Functionality: Stores the values of registers V0 through Vx in memory starting at the address in I.
Implementation Details: For each register from V0 to Vx, the function stores its value in memory, beginning at the address specified by the index register.

```rust
    fn OP_Fx55(&mut self) {
        let Vx: u16 = (self.op_code & 0x0F00).checked_shr(8).unwrap_or(0);

        for i in 0..(Vx +1) {
            self.memory[(self.index_register + i) as usize] = self.registers[i as usize];
        }
        if self.debug_mode {
            eprintln!("Ran opcode: {}", function_name!());
        }
    }
```

**OP_Fx65** - Read registers V0 through Vx from memory starting at location I
Functionality: Populates registers V0 through Vx with values from memory starting at the address in I.
Implementation Details: For each register from V0 to Vx, the function assigns it the value found in memory, starting at the address in the index register.

```rust
    fn OP_Fx65(&mut self) {
        let Vx: u16 = (self.op_code & 0x0F00).checked_shr(8).unwrap_or(0);

        for i in 0..(Vx +1) {
            self.registers[i as usize] = self.memory[(self.index_register + i) as usize];
        }
        if self.debug_mode {
            eprintln!("Ran opcode: {}", function_name!());
        }
    }
```

**OP_ERR** - Fallback opcode for errors
Functionality: Error-handling opcode for invalid opcodes.
Implementation Details: When an opcode does not match any of the known opcodes, this function is triggered. It prints an error message showing the invalid opcode.

```rust
    fn OP_ERR(&mut self) {
        eprintln!("[ERROR]: Opcode {} not valid", self.op_code); 
        if self.debug_mode {
            eprintln!("Ran opcode: {}", function_name!());
        }
    }
```

# Function Pointer Table

One of the unique characteristics of the CHIP-8 instruction set is that it is not strictly linear.

Some opcodes require multiple levels of decoding. Rather than having a monolithic function to handle every possible opcode, it's more efficient and maintainable to use tables (or jump tables). These tables store function pointers, pointing to the relevant opcode implementation.

This design not only makes the code cleaner but also improves opcode lookup times.

## Table0 Function

```rust
fn Table0(&mut self) {
    if self.debug_mode {
        eprintln!("Running table: {}", function_name!());
    }
    self.table0[(self.op_code & 0x000F) as usize](self);
}
```

Purpose: This function handles opcodes that begin with the hexadecimal 0.
Implementation Details: The opcode's last nibble (4 bits) is extracted and used as an index to look up the corresponding function in the table0 array. This function pointer is then invoked with the emulator's current instance as its argument.

## Table8 Function

```rust
fn Table8(&mut self) {
    if self.debug_mode {
        eprintln!("Running table: {}", function_name!());
    }
    self.table8[(self.op_code & 0x000F) as usize](self);
}
```

Purpose: This function addresses opcodes that start with 8 and are followed by three more hexadecimal values, where the last nibble determines the exact operation (e.g., ADD, OR, AND).
Implementation Details: Similar to Table0, the last nibble of the opcode determines the exact function to call from the table8 array.

## TableE Function

```rust
fn TableE(&mut self) {
    if self.debug_mode {
        eprintln!("Running table: {}", function_name!());
    }
    self.tableE[(self.op_code & 0x000F) as usize](self);
}
```

Purpose: Manages opcodes beginning with E.
Implementation Details: The function uses the opcode's last nibble to find the corresponding function from the tableE array.

## TableF Function

```rust
fn TableF(&mut self) {
    if self.debug_mode {
        eprintln!("Running table: {}", function_name!());
    }
    self.tableF[(self.op_code & 0x00FF) as usize](self);
}
```

Purpose: A handler for opcodes that start with F. Unlike the previous tables, the distinguishing feature for opcodes managed by this table is the last two hexadecimal values (byte).
Implementation Details: The function extracts the opcode's last byte and uses it to fetch the relevant function from the tableF array.

# Fetch, Decode, Execute

The main cycle in a CHIP-8 emulator represents the heart of its operation. Each iteration of this cycle is broken in 3 parts: **fetch** an opcode, **decode** it, and then **execute** the corresponding instruction. Let's dissect each part of the Cycle function to understand its role.

```rust
pub fn Cycle(&mut self) { ... }
```

This function defines the main operational cycle of the emulator. It's called repeatedly to ensure the CHIP-8 system remains functional.
Fetching the Opcode

```rust
self.op_code = ((self.memory[self.program_counter as usize] as u16).checked_shl(8).unwrap_or(0)) | self.memory[(self.program_counter + 1) as usize] as u16;
```

Purpose: CHIP-8 opcodes are 2 bytes long. This section combines two consecutive bytes from the emulator's memory to form a single opcode.
Implementation Details: The opcode is constructed by shifting the first byte to the left by 8 bits and then performing a bitwise OR with the second byte. This essentially merges the two bytes into one contiguous 16-bit opcode.

**Incrementing the Program Counter**

```rust
self.program_counter += 2;
```

Purpose: The program counter points to the memory location of the next opcode to be executed. Since each opcode is 2 bytes long, the program counter needs to be incremented by 2 to point to the next instruction.
Implementation Details: A simple addition operation increments the program counter by two.

**Decoding and Executing the Opcode**

```rust
self.table[((self.op_code & 0xF000).checked_shr(12).unwrap_or(0)) as usize](self);
```

Purpose: Determines which instruction the fetched opcode represents and then executes that instruction.
Implementation Details:
The most significant nibble (the first 4 bits) of the opcode is extracted. This value is then used as an index to fetch the corresponding function pointer from the table array.
The function pointer (which points to an opcode-handling function) is then invoked.

**Decrementing the Delay Timer**

```rust
if (self.delay_timer > 0) {
    self.delay_timer -= 1;
}
```

Purpose: CHIP-8 has a delay timer that counts down at 60Hz when set to a non-zero value. When this timer reaches zero, it stops counting down.
Implementation Details: If the delay timer is greater than 0, it's decremented by 1.

**Decrementing the Sound Timer**

```rust
if (self.sound_timer > 0) {
    self.sound_timer -= 1;
}
```

Purpose: The CHIP-8 system also features a sound timer. When this timer is non-zero, a beep sounds, counting down at the same 60Hz frequency.
Implementation Details: Similar to the delay timer, if the sound timer's value is above 0, it gets decremented by 1.

# Results

{% include auto-image-gallery.html folder="/assets/posts/chip8/" %}

# References & Acknowledgments

When coding this emulator, I was around 15 years old. I took heavy inspiration from [this awesome guide](https://austinmorlan.com/posts/chip8_emulator/) by Austin Morlan.

While the Rust code is 100% mine, his C++ code was a big inspiration while creating both the program and this writeup.
