const gulp = require("gulp");
const fs = require("fs");
const path = require("path");
const through = require('through2');
const hljs = require('highlight.js');
const replace = require('gulp-replace');
const htmlmin = require('gulp-htmlmin');
const cleanCSS = require('gulp-clean-css');
// const uglify = require('gulp-uglify');
const imagemin = require('gulp-imagemin');
const clean = require('gulp-clean');
const sitemap = require('gulp-sitemap');
const rename = require("gulp-rename");
const bs = require('browser-sync').create();
const md = require('markdown-it')({
    highlight: function (str, lang) {
        if (lang && hljs.getLanguage(lang)) {
            try {
                return hljs.highlight(lang, str).value;
            } catch (__) { }
        }

        return ''; // use external default escaping
    }
});

// TODO Faire un fichier de config avec toutes les infos reprises un peu partout
// TODO Intégrer la date de rédaction de l'article dans le nom du fichier html, sans écraser si modification
// TODO Faire en sorte que l'affichage des articles de la page d'accueil soit "sympa" = pas toujours les mêmes rectangles
// TODO Resize automatique des images dans les différents formats voulus
// TODO Gérer des catégories d'articles. Avoir une page par catégorie qui liste les articles
// TODO Audit SEO
// TODO Afficher la date de dernière mise à jour de l'article dans le fichier html
// TODO Mettre le site sur www au lieu de blog (ovh + github)
// TODO Possibilité de voir le site en offline (webworker)
// TODO PWA ?

// BrowserSync
function browserSync(done) {
    bs.init({
        server: {
            baseDir: "./"
        },
        port: 3000
    });
    done();
}

// BrowserSync Reload
function browserSyncReload(done) {
    bs.reload();
    done();
}

const md2html = (template) => {
    return through.obj(function (chunk, _enc, cb) {
        const filePath = path.parse(chunk.path);
        const mdFileContent = chunk.contents.toString("utf-8");

        // Extract article's data
        const article = {
            title: mdFileContent.match(/^# (.+)\n+/m)[1],
            image: filePath.name + ".jpg",
            content: mdFileContent.replace(/^# (.+)\n+/m, ""),
        };

        // Detect code blocks' languages
        highlightLanguagesScripts = article.content.match(/^```(\w+)$/gmi);
        highlightLanguagesScripts = highlightLanguagesScripts
            .filter(function (item, pos, self) {
                return self.indexOf(item) == pos;
            })
            .map((language) => {
                language = language.replace("```", "");
                language = `<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.13.1/languages/${language}.min.js"></script>`
                return language;
            });
        highlightLanguagesScripts = highlightLanguagesScripts.join("");

        // Generate HTML file
        article.content = md.render(article.content);
        article.content = article.content.replace(/<h2>(.*)<\/h2>/gm, '</div><h3 class="mdl-cell mdl-cell--12-col mdl-typography--headline">$1</h3><div class="mdl-cell mdl-cell--8-col mdl-card__supporting-text no-padding ">');
        if (article.content.substring(0, 3) !== "<h3") {
            article.content = '<div class="mdl-cell mdl-cell--8-col mdl-card__supporting-text no-padding ">' + article.content;
        }
        article.content += "</div>";

        // Replace placeholders by article's data
        // const finalHtml = template
        //     .replace("@ARTICLE_TITLE@", article.title)
        //     .replace("@ARTICLE_IMAGE@", article.image)
        //     .replace("@ARTICLE_CONTENT@", article.content)
        //     .replace("@JS_HIGHLIGHT_LANGUAGES@", highlightLanguagesScripts);

        const finalHtml = template.replace("@CONTENT@", `
            <div class="mdl-cell mdl-cell--12-col mdl-card mdl-shadow--4dp">
                <div class="mdl-card__title">
                    <h2 class="mdl-card__title-text">${article.title}</h2>
                </div>
                <!-- <div class="mdl-card__media">
                    <img class="article-image" src="../assets/img/${article.image}" border="0" alt="">
                </div> -->

                <div class="mdl-grid portfolio-copy">${article.content}</div>
            </div>
        `)
            .replace("@TITLE@", article.title)
            .replace("@JS_HIGHLIGHT_LANGUAGES@", highlightLanguagesScripts);

        // Create buffer
        const htmlFile = chunk.clone();
        htmlFile.contents = Buffer.from(finalHtml);
        htmlFile.path = path.join(filePath.dir, filePath.name + ".html");

        cb(null, htmlFile);
    });
}

const generateHtmlArticles = () => {
    const template = fs.readFileSync("./src/templates/layout.html").toString();

    return gulp.src(path.join(__dirname, "src/articles/**/*.md"))
        .pipe(md2html(template))
        .pipe(gulp.dest("./articles"));
};

const generateArticlesIndex = () => {
    const articlesUrl = [];
    const articleFiles = fs.readdirSync(path.join(__dirname, "articles"));
    articleFiles.forEach((filename) => {
        if (filename !== "index.html") {
            const filePath = path.join(__dirname, "articles", filename);
            const fileContent = fs.readFileSync(filePath, 'utf-8').toString();
            articlesUrl.push(`<li><a href="/articles/${filename}">${/<h2 class="mdl\-card__title-text">(.+)<\/h2>/.exec(fileContent)[1]}</a></li>`);
        }
    });
    let articlesTpl = fs.readFileSync("./src/templates/articles.html").toString();
    articlesTpl = articlesTpl
        .replace("@TITLE@", "Categories")
        .replace("@ARTICLES_LIST@", articlesUrl.join(""));

    return gulp.src(path.join(__dirname, "src/templates/layout.html"))
        .pipe(replace("@TITLE@", "Categories"))
        .pipe(replace("@CONTENT@", articlesTpl))
        .pipe(rename("./articles/index.html"))
        .pipe(gulp.dest("./"));
}

const populateHomePage = () => {
    const cardTpl = fs.readFileSync("./src/templates/components/article-card.html").toString();
    const articles = [];
    const articleFiles = fs.readdirSync(path.join(__dirname, "articles"));
    articleFiles.forEach(function (filename) {
        if (filename !== "index.html") {
            const filePath = path.join(__dirname, "articles", filename);
            const stats = fs.lstatSync(filePath);
            if (stats.isFile()) {
                const fileContent = fs.readFileSync(filePath, 'utf-8').toString();
                articles.push(cardTpl
                    .replace("@ARTICLE_IMAGE@", path.join("./", filename).replace(".html", "") + ".jpg")
                    .replace("@ARTICLE_TITLE@", /<h2 class="mdl\-card__title-text">(.+)<\/h2>/.exec(fileContent)[1])
                    .replace("@ARTICLE_CONTENT@", "")
                    .replace(/@ARTICLE_PATH@/gm, path.join("./articles/", filename))
                );
            }
        }
    });

    return gulp.src(path.join(__dirname, "src/templates/layout.html"))
        .pipe(replace("@TITLE@", "Robin Monteil - Web development, domotic, space, and random geekeries"))
        .pipe(replace("@CONTENT@", articles.join("")))
        .pipe(rename("./index.html"))
        .pipe(gulp.dest("./"));
};

const watchFiles = () => {
    gulp.watch(
        ["./src/**/*.*"],
        { ignoreInitial: false },
        gulp.series(
            gulp.parallel(
                gulp.series(
                    generateHtmlArticles,
                    gulp.parallel(populateHomePage, generateArticlesIndex),
                ),
                copyAssets
            ),
            browserSyncReload
        )
    );
};

const minifyHtml = () => {
    return gulp.src(["index.html", "articles/**/*.html"], { base: "." })
        .pipe(htmlmin({
            collapseWhitespace: true,
            minifyCSS: true,
            minifyJS: true,
            removeComments: true,
        }))
        .pipe(gulp.dest('./'));
};

const minifyCss = () => {
    return gulp.src('./src/assets/css/*.css')
        .pipe(cleanCSS({ compatibility: 'ie8' }))
        .pipe(gulp.dest('./assets/css'));
};

const minifyImg = () => {
    return gulp.src("./src/assets/img/*", { base: "./src" })
        .pipe(imagemin()) // { verbose: true }
        .pipe(gulp.dest('./'));
};

// const minifyJs = () => {
//     return gulp.src('./assets/js/*.js'),
//         uglify(),
//         gulp.dest('./assets/js')
// };

const copyAssets = () => {
    return gulp.src("./src/assets/**/*.*", { base: "./src/assets" })
        .pipe(gulp.dest("./assets"));
};

const generateSitemap = () => {
    return gulp.src(["./index.html", "./articles/**/*.html"], {
        read: false,
        base: ".",
    })
        .pipe(sitemap({
            siteUrl: 'https://www.robinmonteil.fr',
            changefreq: "monthly",
            priority: (...arg) => {
                if (arg[1].includes("/articles/")) {
                    return "1.0"
                }
                return "0.1";
            }
        }))
        .pipe(gulp.dest('./'));
};

const cleanDir = () => {
    return gulp.src([
        "./index.html",
        "./sitemap.xml",
        "./articles",
        "./assets"
    ], { read: false })
        .pipe(clean());
}

gulp.task("build",
    gulp.series(
        cleanDir,
        gulp.parallel(
            gulp.series(generateHtmlArticles, populateHomePage, generateArticlesIndex, minifyHtml, generateSitemap),
            minifyCss,
            // minifyJs,
            minifyImg,
        )
    )
);

gulp.task("watch", gulp.parallel(watchFiles, browserSync));
