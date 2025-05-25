extern crate console_error_panic_hook;
use std::panic;
use wasm_bindgen::prelude::*;

const CHAR_ENCODING: &[u8; 64]= b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

#[wasm_bindgen]
pub fn pattern_to_base_n(number_of_states: usize, block_size: usize, width: usize, pattern: Vec<usize>) -> String{
    panic::set_hook(Box::new(console_error_panic_hook::hook));
    let lookup_table=CHAR_ENCODING;
    let emptystring: String = String::from("");
    if pattern.is_empty() || pattern.len()%width!=0 { return emptystring; }
    let height = pattern.len() / width;
    let new_pattern: Vec<u8> =  (0..div_up(height, block_size)).flat_map(|row| {
        (0..width).map(|col| lookup_table[pattern[
            row*block_size+col*height..std::cmp::min(height, (row+1)*block_size)+col*height
        ].iter().enumerate().fold(0, |acc, (i, x)| acc + x*number_of_states.pow(i as u32))]).collect::<Vec<u8>>()
    }).collect();
    String::from_utf8( new_pattern).unwrap()
}

const CHAR_LOOKUP: [usize; 128] = {
    let mut i = 0;
    let mut array: [usize; 128] = [0; 128];
    while i < 64 {
        array[CHAR_ENCODING[i] as usize] = i;
        i+=1;
    }
    array
};

pub fn div_up(a: usize, b: usize) -> usize { (0..a).step_by(b).len() }

#[wasm_bindgen]
pub fn base_n_to_pattern(number_of_states: usize, block_size: usize, width: usize, height: usize, encoding: String) -> Vec<i32>{
    panic::set_hook(Box::new(console_error_panic_hook::hook));
    (0..width).flat_map(|col| {
        let mut stack = 0;
        let mut pattern = Vec::with_capacity(width*height);

        for i in 0..height{
            if i%block_size==0 {
                let index: usize = col+i/block_size*width;
                stack = CHAR_LOOKUP[encoding.as_bytes()[index] as usize];
            }
            // ops+=1;use js_sys::Int32Array;
            let cell_state = stack%number_of_states;
            pattern.push(cell_state as i32);
            stack/=number_of_states;
        }
        pattern
    }).collect()
}
