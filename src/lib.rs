extern crate console_error_panic_hook;
use std::panic;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn pattern_to_base_n(number_of_states: usize, block_size: usize, width: usize, pattern: Vec<usize>) -> String{
    panic::set_hook(Box::new(console_error_panic_hook::hook));
    let lookup_table=b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
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

pub fn div_up(a: usize, b: usize) -> usize { (0..a).step_by(b).len() }
