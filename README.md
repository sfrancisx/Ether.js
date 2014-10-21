Overview
========

According to 19th century phycists, luminiferous aether was the undetectable medium for the
propagation of light.  The goal of ether.js is to be an undetectable medium for the propagation
of data in a JavaScript application.  

Ether allows you to get data change events on any normal JavaScript object.

For example:

```javascript
var book = { title: "Moby Dick", inStock: true };
Ether.onChange(book,
    {
        inStock: function()
        {
            if (!this.inStock) alert(this.title + " has sold out");
            else alert("A shipment containing " + this.title + " has arrived");
        }
    });
```

Ether does **not** generate data change events by polling for changes on the object - that would
violate its goal of being undetectable.  It uses JavaScript getters and setters to intercept
the change and fire the event.  This means there's very little overhead for a handler and it's
practical to have change handlers on every object in your application.  Adding a second change
handler to an object is even cheaper.

Usage
-----

1. Include Ether
```html
   <script src="registry.js">
   <script src="registrar.js">
   <script src="ether.js">
```
2. There is no step 2.  You don't need to create a model or use special methods to set values
into it.  Your objects continue to look and act exactly like JavaScript objects.

FAQ
---
###"Exactly like JavaScript objects".  Really?

No.  Unfortunately, JavaScript doesn't allow Ether to be completely undetectable.  One obvious
limitation is that you can't create your own getters and setters.

I think Ether could be less detectable, but that gets kind of crazy.  Ether could replace
`Object.defineProperty()` with its own implementation, and chain your getters/setters, for example.

Ether include a patch for Chrome's debugger.  If you don't apply the patch, the debugger shows
Ether's getters/setters when you examine an object, instead of the values.  If you do apply the
patch, the debugger has to evaluate the getter to display the value.  If you use a getter on
a non-etherized object that has complex getters this may have unintended side effects.

###Why wouldn't I use `Object.observe()`?

No browser implemented `Object.observe()` when Ether was written in 2012.  As I'm writing this,
Chrome is the only browser with support.  

###Does it work in all browsers?

I've only used it with Chrome, but the code is all standards-compliant as far as I know.  It
should work with IE 9+, FF 4+, Safari 5+ and Chrome 5+.

###Are change handlers as cheap as you claim?

Almost.  If you have a handler it means that every property access includes a function call too.
In practice this has had no noticible effect.  Our application is large (50,000+ lines), but it's
not your application.  If you're doing something data intensive, experiment a little before
committing to Ether.  (There's also the execution time of your handler, but that's probably
unavoidable.)

Attaching the change handlers takes far longer than I'd like (although less time than creating
models in other frameworks).  I hope to add the ability to attach them asynchronously soon to
mitigate this, but I don't know when or if I'll get around to it.

###What about arrays?

Yep, we've got them covered, at least if you confine yourself to array mutators (push, pop, etc.)
You can have Ether apply the same change handler to every object in the array.  Ether will
subscribe to new elements and unsubscribe from old ones automatically.  You can also get notified
when the array itself changes.

###Registry?  Registrar?

Yah, sorry.  I've recently had my naming license revoked because I'm so bad at it.  The registry
lets you use objects as keys in key/value pairs, and it allows multi-valued keys.

The registrar is a pretty useful idea, and should be a stand-alone component in its own right.
Register any number of Ether's `on` functions with it.  Call `cleanup()` on the registrar and it will
call the `off` functions for you.  The idea works with any pair of create/destroy functions, but
the registrar only implements a couple of non-Ether-event pairs: `getRegistrar()`/`cleanup()` and
`addEventListener()`/`removeEventListener()`.

###What's this "console.js" thing?

Ether was developed as a small part of a much larger project.  The console replacement was part of
that project, and it's pretty stand-alone so I decided to include it.  It has a couple of neat
features, but the most useful one for us has been the ability to turn on stack traces for our
existing logging.

Ether includes a second patch for Chrome's debugger so Ether's `console.log()` will show the correct
line number in the console.  It's a small thing, but it's very nice to be able to click on a log
message and have the debugger show the code that generated the message rather than the code that
just wrote it to the console.

###What else is it good for?

I'm glad you asked!  It has been a great aid in debugging on occasion.  Many of us have experienced
the "mysterious changing value" problem.  You're in the debugger sitting on some breakpoint.  Some
object has the expected values in it.  You run the program, and at the next breakpoint the values
have changed and you have no idea why.  Ether has a simple solution: `Ether.Debug.breakOnChange()`.
So at the first breakpoint, you type something like
```javascript
Ether.Debug.breakOnChange(book, "title")
```
into the console.  When the mysterious change happens, Ether will enter the debugger for you.

Ether could also be used for data validation, but this is something else I haven't implemented yet.
You'd do something like:
```javascript
Ether.Debug.validateIn(book, "inStock", [ true, false ]);
```
and it would make sure that book.inStock is always true or false.  

The debugging aids can be useful even if you have to support IE 8.  Develop on a modern browser,
but stub out Ether in production.

###This isn't object oriented.

That's not a question, and you're wrong.  Or at least confused.  I'm not even sure what your
statement means.  Yes, typing:

`Ether.Event.onChange(book, handler)`

is different than typing:

`book.onChange(handler)`

but why would `onChange()` be part of my book object anyway?  When I list the properties of a book, I
think of things like title, author, ISBN, SKU, length, price.  One of the many things I don't
expect my book object to do is to notify me if its price changes.

Notes
-----
Ether is documented for YUIDoc.  I think the documentation for the API is decent, but it could
definitely use some work.

Author
------
[Steve Francis](https://github.com/sfrancisx)
