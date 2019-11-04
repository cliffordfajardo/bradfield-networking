# Control Characters
A special, non-printing character that begins, modifies, or ends a function, event,
operation or control operation. The ASCII character set defines 32 control characters.
Originally, these codes were designed to control teletype machines.
Now, however, they are often used to control display monitors, printers, and other modern devices.

### Non printing characters (AKA Control Characters)
Are control characters, but they're also called non printing characters. Why are they called this?
When we use control character (or non printing characters) in our computer code, we don't actually
see the control character in our final result. Examples below:

### line feed (\n === U+000A)  

```js
String.fromCodePoint(0x000A) === '\n' // true
const text = "a\nb\nc";               // text displays as:
`
a
b
c
`

//If we were in a REPL our cursor would be at the end of c.
`
a
b
c|
`
```




### carriage return (\r === U+000D)
A carriage return on a printer moved the print position to the begining of the current line but stayed on the same line.
Use case(s):
- was used for bold or underlining (assuming the printer only worked L-R)

```js
String.fromCodePoint(0x000D) === '\r'    // true
const text0 = `aaa\rbb cc\n`             // In a terminal REPL text displays as:
`
bb cc
|
`



const text1 = `aaa\rbb cc\ndd`           // In a terminal REPL text displays as:
`
bb cc
dd|
`

const text2 = `aaa\rbb`// In a terminal REPL text displays as:
`
bba  |
`

const text3 =  `aa\r`
`
`
```


In code: `apple\rpie`
When we print/display the string with the carriage return chacters(\r) 
a
b
|c
```






# Resources
https://knowledge.ni.com/KnowledgeArticleDetails?id=kA00Z0000019KZDSA2
https://coderanch.com/t/377912/java/Newline-Carriage-return