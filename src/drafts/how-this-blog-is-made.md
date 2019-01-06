# How this blog is made?

## Hosting and domain
The leitmotiv of this blog being sharing, it seemed normal to me to share its source code publicly, so it is available on [Github](https://github.com/rmonteil/rmonteil.github.io).

For the domain name, I use OVH with whom I have owned robinmonteil.fr for several years to avoid cybersquatting. Until now, this domain has only redirected to my Linkedin account.

## Code
In my company ([Allomedia](http://www.allo-media.net), check it out!), I've been using TypeScript for a while now, and even if the language is not perfect, I got to really like it over vanilla JS, mainly for its typing system. Moreover, since I wanted this project to be open source, I wanted to use a mainstream language, which Typescript is, according to me.

## Edition
I didn't want to use a content editor like Wordpress or Medium so I can't just write text which is converted to HTML. But I also didn't want to edit HTML files manualy...
So I came to the solution to edit Markdown files, which are really simpler to understand. Those files are then converted to HTML at build time.

Bonus: I can edit those files _via_ Github!

## Deployment
It is as simple as `npm run publish`!