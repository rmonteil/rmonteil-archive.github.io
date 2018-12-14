const gulp = require("gulp");
const fs = require("fs");
const path = require("path");
const through = require('through2');
const hljs = require('highlight.js');
const replace = require('gulp-replace');
const htmlmin = require('gulp-htmlmin');
const cleanCSS = require('gulp-clean-css');
// const uglify = require('gulp-uglify'); // To re-activate for JS min
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
const utils = require("./build-tools/utils");
const articless = utils.getArticlesList();

// TODO UTILE ? Gérer des catégories d'articles. Avoir une page par catégorie qui liste les articles
// TODO Faire un fichier de config avec toutes les infos reprises un peu partout
// TODO Intégrer la date de rédaction de l'article dans le nom du fichier html, sans écraser si modification
// TODO Faire en sorte que l'affichage des articles de la page d'accueil soit "sympa" = pas toujours les mêmes rectangles
// TODO Resize automatique des images dans les différents formats voulus
// TODO Audit SEO
// TODO Afficher la date de dernière mise à jour de l'article dans le fichier html
// TODO Mettre le site sur www au lieu de blog (ovh + github)
// TODO Possibilité de voir le site en offline (webworker)
// TODO PWA ?
// TODO Mettre le bon menu en "actif"

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

        // Get the language js file according to the type of languages used on the page
        const highlightScripts = utils.getHighLightLanguages(article.content);

        // Generate HTML file
        article.content = md.render(article.content);
        article.content = utils.formatArticle(article.content);

        // Replace placeholders by article's data
        let articleTemplate = utils.getFileContent("/src/templates/article.html");
        articleTemplate = articleTemplate
            .replace("@TITLE@", article.title)
            .replace("@IMAGE@", article.image)
            .replace("@CONTENT@", article.content);

        // Inject article into layout
        const finalHtml = template
            .replace("@TITLE@", article.title)
            .replace("@CONTENT@", articleTemplate)
            .replace("@JS_HIGHLIGHT_LANGUAGES@", highlightScripts);

        // Create buffer
        const htmlFile = chunk.clone();
        htmlFile.contents = Buffer.from(finalHtml);
        htmlFile.path = path.join(filePath.dir, filePath.name + ".html");

        cb(null, htmlFile);
    });
}

const generateHtmlArticles = () => {
    const template = utils.getFileContent("src/templates/layout.html");

    return gulp.src(path.join(__dirname, "src/articles/**/*.md"))
        .pipe(md2html(template))
        .pipe(gulp.dest("./articles"));
};

const generateArticlesIndex = () => {
    const articlesUrl = [];
    const articleFiles = utils.getArticlesList();
    articleFiles.forEach((article) => {
        const articleContent = utils.getFileContent(article);
        let itemTpl = utils.getFileContent("src/templates/components/articles-list-item.html");
        itemTpl = itemTpl
            .replace("@TITLE@", /<h2 class="mdl\-card__title-text">(.+)<\/h2>/.exec(articleContent)[1])
            .replace("@FILE_PATH@", article);
        articlesUrl.push(itemTpl);
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
    const cardTpl = utils.getFileContent("/src/templates/components/home-article-card.html");
    const articles = [];
    const articleFiles = utils.getArticlesList();
    articleFiles.forEach(function (articlePath) {
        const articleContent = utils.getFileContent(articlePath);
        articles.push(cardTpl
            .replace("@ARTICLE_IMAGE@", utils.getImagePathForArticle(articlePath))
            .replace("@ARTICLE_TITLE@", /<h2 class="mdl\-card__title-text">(.+)<\/h2>/.exec(articleContent)[1])
            .replace("@ARTICLE_CONTENT@", "")
            .replace(/@ARTICLE_PATH@/gm, articlePath)
        );
    });

    return gulp.src(path.join(__dirname, "src/templates/layout.html"))
        .pipe(replace("@TITLE@", "Web development, domotic, space, and random geekeries"))
        .pipe(replace("@CONTENT@", articles.join("")))
        .pipe(replace("@JS_HIGHLIGHT_LANGUAGES@", ""))
        .pipe(rename("./index.html"))
        .pipe(gulp.dest("./"));
};

const generateContactPage = () => {
    const contactPageHtml = utils.getFileContent("/src/templates/contact.html");

    return gulp.src(path.join(__dirname, "src/templates/layout.html"))
        .pipe(replace('<div class="mdl-grid portfolio-max-width">', '<div class="mdl-grid portfolio-max-width portfolio-contact">'))
        .pipe(replace("@TITLE@", "Contact"))
        .pipe(replace("@CONTENT@", contactPageHtml))
        .pipe(replace("@JS_HIGHLIGHT_LANGUAGES@", ""))
        .pipe(rename("./contact.html"))
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
                generateContactPage,
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
    ], {
            read: false,
            allowEmpty: true
        })
        .pipe(clean());
}

gulp.task("build",
    gulp.series(
        cleanDir,
        gulp.parallel(
            gulp.series(generateHtmlArticles, populateHomePage, generateArticlesIndex),
            generateContactPage,
            minifyCss,
            // minifyJs,
            minifyImg,
        ),
        gulp.parallel(minifyHtml, generateSitemap),
    )
);

gulp.task("watch", gulp.parallel(watchFiles, browserSync));
