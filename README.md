# Aya
Programming language which compiles to JavaScript

## Features
- No equal sign for assignment
- No square brackets
- Curly brackets used in specific case only
- Comma between instructions only
- Auto defining function arguments

## Advantages
- Less code saves time
- Readable compiled JS code
- Unique features, such like Emit and Substitute
- Advanced debug logging
- Combined development and production mode

### Indents
Indents work with tabs

### Comments
```
/* Multi
   line
   comment */
# usual comment
```

### Assignment
```
/* Assignments of variables with appropriate names
   will `let` them automatically at the first line of the scope */
a: 1    # usual assignment (colon can be used for visual comfort)
b c 1   # sequenced assignment (no-colon variant is also possible)
d.e: a  # assignment to chained entity (colon is necessary)
```

### Function declaration and calling
```
/* Default values of arguments started with \ and can be expressions.
   Arguments are set automatically: calling of undefined variables
   in a function body (such like `a` and `b` in this example) turns them into arguments
   (in order of using), so here `a` will become the first argument and `b` - the second.
   Third argument in the example below is not used (it is only for demostration).
   Any not-assignment expression in a function body becomes its return value.
*/
f: g: 0
Func  \'Hello' \'world' \f + g
   g 1                           # will be taken `g` from outer scope
   .f 1                          # `f` will be assigned in the function scope (starting dot)
   a + ' ' + b
  
# Calling Func without arguments will output the string 'Hello world'
# If a function is called without arguments it should end up with dot (.)
# (If a function is called outside the function scope and is single entity in the line, dot can be omited)
Func.

# Calling Func with arguments below will output the string 'Hello my beautiful world'
# Every single argument can be expression and divided by blanket
Func 'Hello ' + 'my' 'beautiful world'

# Inside function scope behaviour depends on finishing dots
Func
   func_call        # returns func_call without calling
   func_call.       # only calls
   func_call..      # returns calling
/* also returns calling 
   (second dot is not needed because 
   arguments indicate function call) */  
   func_call 1 10.

# A is a definition of anonimous function;
# here anonimous function assigned to variable `func`
func A
   log 'the body'

/* Tilda (~) is definition for arrow function;
   here arrow function assigned to variable `func`;
   the example shows one-line declaration */
func ~ \'default value' prefix 'Returning ', prefix+arg1
log func.  # prints 'Returning default value'

/* The finishing dot after function call
   should be used to indicate end of current call
   to return on previous stacked instruction
   (such like Func call in the example below). 
   Example below will call Func with 2 arguments,
   first argument is func call with argument func_arg */
Func func func_arg. Func_arg
  
```

### Arrays
```
summarizeFirstTwoElements
  arg.0 + arg.1           # Example of calling array elements values by index
arr.. 1+2 10              # Creating new array `arr` and setting its two first elements with values

# Double dots magneted right on existing array will push new value
# This equivalents to `arr.push('hello')` in JS
arr.. 'hello'

# Calling this function below will output number 13
summarizeFirstTwoElements arr

# Array literal defined with separate .. (two dots)
# This will output 7 (.. 3 4 is array literal with two first elements assigned)
summarizeFirstTwoElements .. 3 4
```

### Objects
```
# named object literal
obj ::

/* Object assignment and almost everything in Aya can be expressed in two ways:
   1) Single-line instruction
   2) Multi-line tabbed instructions */
obj1::
   key1: 100
   key2: 5
  
obj2:: k1:'Hello '+'my dear ' k2:'world'  # Values are recognized as single expression

# `log` is build-in function and is alias to console.log
# Instruction bellow outputs 'Hello my dear world' in dev. console
log obj2.k1 + obj2.k2

# Nested objects are also defined with :: (two colons) which should be magneted to the key (`two` in this case)
obj3::
   one: 1
   two::
      x:5 
      y:'some'
   three: 1 + 1 + 1

# The same in one-line
# End dot indicates finishing of nested object assignment
obj3:: one: 1 two:: x:5 y:'some'. three: 1 + 1 + 1

# Object literals are defined with separate ::
# Singletone key-values can be used (as `a` here)
Func
   log a1.a + a1.'is string'   # Example of calling object's values
a 1
Func :: a 'is string':2       # Outputs `3`

/* If as a key is used variable which assigned in any parent scope, such like `b` here
   `b` becomes a key-expression (equivalent [b] in JS)
   'one'+'two' is also key-expression in the example bellow */
b 'hello'
obj4::
   b:'world'
   'one'+'two': 3
```

### Chains
```
/* Object's `func` key value is anonomous function (A)
   calling it can be without finishing dot 
   if currently not in function scope */
obj::
   func: A \1 \1
      a+b
obj.func
log obj.func 5 5  # outputs 10

# Assignment of value for the key
obj.some_key: 'hello'

# Even long immidiate assignment
# no matter if arr_obj defined before
arr_obj.0.'hello': 'world'

/* Continue chaining
   space before starting dot is necessary
   example bellow calls 3 sequenced (chained) functions
   even last one needs finishing dot to call.
   next_func_call do not needs finishing dots,
   because argument values indicate function call */
obj.func. .next_func arg1 arg2 .one_more_func.

# Two dots magneted to right of expression create
# key-expression ( in JS this will be a[0]['hello'+b].hello() )
b 'world'
a ::
a.0 ..'hello '+b .hello.
a.0. ..'hello '+b .hello.   # JS: a[0]()['hello'+b].hello() -- additional dot changes a lot

/* Force cast variable as key-expression
   here is zero (0) before variable ( equivalent in JS: a[b] = Func ) 
   and if `a` is not defined it will be defined as array in resulting JS */
b 10
a.0b: Func
```

### If, Else, If-else, Relational expressions
```
# If `a` equal to `b` (= is == in JS)
a = b ? log 'do something'

# If `a` is not equal to `b` (! as single separated entity is != in JS)
# Semicolon (;) means `else`
a ! b ? log 'do something' ; log 'do something else'

/* If `a` AND `b`, ( single ampersand (&) is && in JS )
   else if `a` OR `b`, ( single (|) is || in JS ) */ 
a & b ?
   log 'do something'
; a | b ?
   log 'do something if-else'
;
   log 'do something else'

# == is === in JS (strict equality)
a == b ? log 'do something'

# != is !== in JS (strict inequality)
a != b ? log 'do something'

# Exclamation mark magneted right to entity is inversion (works similar as in JS)
# Here we ask: "Is `a` not equal to NOT (inversed) `b`?"
a ! !b ? log 'do something'

/* Other relational operators:
   >= <= > <
   look and work as usual */
```

### Loops
```
# Simple from 0 up to 10 iterator
0..10
   log 'Repeat this'

# Descending iteration, result saved in `i` (name can be chosen)
# Used custom `i` decreasing expression
10..0 (i-=2) log `i value is: ${i}` # logs: 10, 8, 6, 2, 4, 0

# Variables (expressions) can be used also
from: 0, to: 10
from..to+5 (i) log i  # iterates 16 times

/* Loop construction which equivalent to JS for-in
   This prints 1, 2 and 3 on every iteration
   `v` is value, `k` is key, `i` is autoincremented ordering index (from 0)
   `k` and `i` are optional, variable names can be chosen */
obj:: a:1 b:2 c:3
obj..(v k i)
   log v

/* Infinite loop
   single separate dot means `break`
   double separate dots means `continue` */
0..I (i)
   i=100? .
   i<50? ..
   log 'Do something'
```

### Class
```
# Class is defined with `C` (`c` capital letter)
C className
   a: 1  # class scope variable definition
   C \'some_default_value'             # constructor defined also with `C`
      log 'Constructor instructions'
   class_func
      log 'Usual function of the class, input: ' + arg
   << static_func
      log 'Static function of the class'
   G get_func                          # Capital letter `G` defines getter
      _class_func 'Hello'.              # returns this.class_func call with 'Hello' inputed argument
      log 'Getter of the class'
   S set_func                          # Capital letter `S` defines getter
      _a: arg                           # `a` preceding underline turned to this.a
      log 'Setter of the class'

# `<<` is equivalent to `new` in JS
class_exemplar << className 'Some string argument'

# childClass extends className
C chidClass className
   C
      super   # may be called without ending dot
```

### Emit
```
# Everytime `a` is assigned, function `refresh_containers`
# will be called with `a` as the first argument
a >> refresh_containers
a 'hello'  # calls `refresh_containers a`
```

### Substitute
```
/* With substitutute operator (<-) forwarded by 
   any one-line set of entities, such set is "packed" 
   to substitute word in the left.
   Furtherly, when such substitute separate word is appeared
   it will be converted to its packed content */
custom_condition <- a=b ?
custom_func_call <- Func arg1 arg2

# Using
custom_condition c: b ; c: a   # will be converted to `a=b ? c: b ; c: a`
custom_func_call arg3          # will be converted to `Func arg1 arg2 arg3`
/* Conversion occured before the whole instruction starting execution */

# With replace
# Import JQuery:
@'https://ajax.googleapis.com/ajax/libs/jquery/3.6.0/jquery.min.js'

# Substitute with replace rule:
$1 <- $ '<$1>'. .html $2 .appendTo $3

# Aya substitution instruction (every expression will be put to appropriate $index
$1 div 'html content' document.body

#Output JS:
#$('<div>').html('html content').appendTo(document.body);
```

### Import
```
# Global JS. Opens ability to use `$` immediatelly in Aya script
@'https://ajax.googleapis.com/ajax/libs/jquery/3.6.0/jquery.min.js'

# Local JS which has export modules. Performed on JS compilation.
modules_set @'path_to_local.js'

# Local Aya (injecting JS compilation directly to compiled JS)
@'local-path.aya'

# Local Aya (Injecting Aya code right here, right now)
@'local-path.aya'.
```

### Try-catch, immediate call & double comma
```
/* When code surrounded by curly brackets
   it appears in `try` scope. Then declaring
   anonimous arrow function gives access to `error`
   variable which keeps error message.
   Double comma will escape the current scope which
   is arrow function declaration in this case.
   Finalizing round brackets perform immediate funcation call,
   after the end of its declaration.
   Inside these brackets can be inputed arguments. */
process_error
  log 'Do something with error'
a 1
{
   a b-1  # this will generate `ReferenceError: b is not defined`
} ~ log error, process_error error,,()
```

### Reserved entities
```
  T   # equivalent to `true` (boolean)
  F   # equivalent to `false` (boolean)
  N   # equivalent to `null` (object)
  U   # equivalent to `undefined` (undefined)
  I   # equivalent to `Infinity` (Infinity)
  A   # start declaration of anonimous function
  ~   # start declaration of anonimous arrow function
  D   # equivalent to `delete` (object key-value pairs deletion)
  G   # equivalent to `GET` (getter)
  S   # equivalent to `SET` (setter)
  _   # equivalent to `this` (object), can be magneted left or separated
  ,   # equivalent to break line with equal tab on the next line; closes line instruction
  ,,  # escaping the current scope (function declaration, loop, if-else)
  .   # single separate dot in loop converted to `break`
  ..  # double separate dot in loop converted to `continue`
  &   # `and` relational operator
  |   # `or` relational operator
  !   # `not equal` relational operator, equivalent to `!=` in JS or usual invertor if magneted to left
  =   # `equal` relational operator
  !=  # strict `not equal` operator, equivalent to `!==` in JS
  ==  # strict `equal` operator, equivalent to `===` in JS
  &&  # `and` bitwise operator, equivalent to `&` in JS
  ||  # `or` bitwise operator, equivalent to `|` in JS
  ~~  # `not`` bitwise operator, equivalent to `~` in JS  
  >>> # `signed right shift` bitwise operator, equivalent to `>>` in JS
  <<< # `zero fill left shift` bitwise operator, equivalent to `<<` in JS
  >>>># `zero fill right shift` bitwise operator, equivalent to `>>>` in JS

```

### Set Up
- Aya scripts are located inside <script type='aya'> tags
- Aya scripts can be pathed as <script type='aya' dev='local-path.aya'> or written inside <script type='aya'></script>
- If Aya set with <script dev='local-path.aya' prod> , the first time it is executed in client''s browser, it will generate JS code from Aya and will put it in cache. Every another time, untill cache is exists, JS code will be taken from cache on client''s browser
- If Aya set with <script dev='local-path.aya' prod='local-path.js'> it will use appropriate local-path.js (or cache, which depends on server or client settings)
- If `prod` attribute is used inside <script type='aya'>, a developer can switch to dev mode, executing command `dev=true` in browser developer console. After this, Aya script will be compiled to JS everytime untill cache exists in that browser or `dev=false` executed.
- If Aya set with <script type='aya' v=0.01> , where value is float, then page refresh counter is linked to the script version, which showed in browser dev console.
- Generated JS appeared in browser dev. console in developer mode
- If Aya set with <script type='aya' debug-aya>, some usefull information, such as assignments and calls will be output in dev. console for Aya execution. Not recommended for production.
- If Aya set with <script type='aya' debug-js>, some usefull information, such as assignments and calls will be output in dev. console during JS execution (for these appropraite instructions added). Not recommended for production.
