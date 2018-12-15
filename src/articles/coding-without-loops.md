# Try coding without loops

In a previous article, I wrote about how trying to solve coding challenges without using if-statements might help uncover better solutions. In this article, we will explore how to solve some more challenges, but this time without using any loops.

By loops, I mean imperative loops like `for`, `for...in`, `for...of`, `while`, and `do...while`. All of these are similar in the way that they provide an imperative way to perform iterations. The alternative is to perform iterations in a declarative way.

## Imperative vs Declarative
This is a big topic. The simplest thing we can say about it is that:

- Imperative represents the HOW
- Declarative represents the WHAT

*What? How? And why should you care?*

An imperative approach represents a list of steps. Do this first, then do that, and after that do something else. For example: *Go over a list of numbers one by one and for every one add its value to a running sum.*

A declarative approach represents what we have and what we need. For example: *We have a list of numbers and we need the sum of those numbers.*

The imperative language is closer to the computers of today because they only know how to execute instructions. The declarative language is closer to how we think and command. Get it done please. Somehow!

The good news is computer languages have evolved to offer us declarative ways to do the needed imperative computer instructions. This article focuses on the declarative alternatives to imperative loops.

Note that coding does not have to be one way or the other. Any non-trivial computer program will most likely have a little bit of both approaches. Also, knowing how to code declaratively is great, but it does not mean that you do not need to learn the imperative ways as well. You should simply be confident using both.

## Immutability

Avoiding loops is not just about being declarative. It also allows us to treat our data immutably.

Data immutability is another big topic, but the big picture is to not modify data in variables and instance properties in order to represent application state. Instead, the state is stored in phases between function calls. The functions call each other sequentially to evolve the original starting point into other forms of data. No variables are mutated in the process.

Instead of abusing state to perform simple operations, staying immutable is a lot safer and cleaner. However, the big benefit of immutability is how it makes the code easier to maintain and extend. For example, when we manage any application state in an immutable way, we can inspect the state at any moment, undo a state change, or even travel back in time to previous states to inspect the application with those. Since the state is not changed, we can always make the application remember the evolving phases of it.

Code readability and performance *might* take a hit when we do things in an immutable way. However, there are many strategies we can use to get the best of both worlds. More on this in future articles.

## Recursion

Another way we can avoid using imperative loops is through recursion.

Recursion is simple. Have a function call itself (which creates a loop) and design an exit condition out of that loop. I am not sure recursion can be classified as declarative, but it is certainly an alternative to using vanilla imperative loops. However, be careful with recursion as it might not perform as well as normal loops. I also don’t think recursion offers good readability in most cases.

Sometimes recursion is naturally the easiest way to solve a challenge. Without recursion we would need to maintain and use our own Stack structure (but that is not too hard either).

---

In all cases, it is always fun to try and solve a coding challenge without the use of any imperative loops.

Here are some example challenges with their loop-based solutions and loop-less solutions. All examples are in JavaScript.

Tell me which solutions you prefer and which ones you think are more or less readable.

## Challenge #1: Compute the sum of a list of numbers
Let’s say we have an array of numbers and we need to compute the sum of these numbers.

Here is an example to test with:
```js
const arrayOfNumbers = [17, -4, 3.2, 8.9, -1.3, 0, Math.PI];
```

Here is a solution using a loop:
```js
let sum = 0;

arrayOfNumbers.forEach((number) => {
  sum += number;
});

console.log(sum);
```

Note how we had to mutate the `sum` variable to accomplish the solution.

Here is a solution using the excellent reduce function:
```js
const sum = arrayOfNumbers.reduce((acc, number) =>
  acc + number
);

console.log(sum);
```

Nothing was mutated with the reduce-based solution. Instead, we made a bunch of calls to the callback function and the state was carried along between these calls until we arrived at our final `sum` state.

Here is the same challenge above solved with recursion:
```js
const sum = ([number, ...rest]) => {
  if (rest.length === 0) { 
    return number;
  }
  return number + sum(rest);
};

console.log(sum(arrayOfNumbers))
```

The `sum` function calls itself and on every turn it uses the *rest* operator to reduce the array it is summing. It stops when that reduced array is empty. While you might think this is a clever solution, I do not think it is as readable as using a simple `reduce` call.