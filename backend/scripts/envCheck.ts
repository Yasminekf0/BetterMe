import "dotenv/config";
// <reference types="node" />

console.log("process exists:", typeof process !== "undefined");
console.log("DASHSCOPE key:", !!process.env.DASHSCOPE_API_KEY);
