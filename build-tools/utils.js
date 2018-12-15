const fs = require("fs");
const path = require("path");

exports.getArticlesList = () => {
    const articles = [];
    const articleFiles = fs.readdirSync(path.join(__dirname, "../src/articles"));
    articleFiles.forEach(function (filename) {
        articles.push(`/articles/${filename}`.replace(".md", ".html"));
    });

    return articles;
};

exports.getFileContent = (filename) => {
    const filePath = path.join(__dirname, "..", filename);
    const stats = fs.lstatSync(filePath);
    if (stats.isFile()) {
        return fs.readFileSync(filePath, 'utf-8').toString();
    }
};

exports.saveFileContent = (filename, content) => {
    fs.writeFileSync(path.join(__dirname, "..", filename), content);
};

exports.getImagePathForArticle = (filename) => {
    return filename
        .replace("articles/", "")
        .replace(".html", ".jpg");
};

exports.getHighLightLanguages = (articleContent) => {
    let highlightLanguagesScripts = articleContent.match(/^```(\w+)$/gmi);
    if (highlightLanguagesScripts) {
        highlightLanguagesScripts = highlightLanguagesScripts
            .filter(function (item, pos, self) {
                return self.indexOf(item) == pos;
            })
            .map((language) => {
                language = language.replace("```", "");
                language = `<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.13.1/languages/${language}.min.js"></script>`
                return language;
            });
        return [
            '<link rel="stylesheet" href="//cdnjs.cloudflare.com/ajax/libs/highlight.js/9.13.1/styles/default.min.css" />',
            '<script src="//cdnjs.cloudflare.com/ajax/libs/highlight.js/9.13.1/highlight.min.js"></script>'
        ].concat(highlightLanguagesScripts).join("");
    }

    return "";
};

exports.formatArticle = (article) => {
    // Set sections headers
    article = article.replace(/<h2>(.*)<\/h2>/gm, '</div><h3 class="mdl-cell mdl-cell--12-col mdl-typography--headline">$1</h3><div class="mdl-cell mdl-cell--8-col mdl-card__supporting-text no-padding ">');
    // Set container
    if (article.substring(0, 3) !== "<h3") {
        article = '<div class="mdl-cell mdl-cell--8-col mdl-card__supporting-text no-padding ">' + article;
    }
    article += "</div>";

    return article;
};

exports.article = {
    exists: (articleName) => {
        const history = JSON.parse(this.getFileContent("/articles-history.json"));
        return history.hasOwnProperty(articleName);
    },
    clean: () => {
        const history = JSON.parse(this.getFileContent("/articles-history.json"));
        Object.keys(history).map(historyEntry => {
            if (!fs.existsSync(path.join(__dirname, `../articles/${historyEntry}.html`))) {
                delete history[historyEntry];
            }
        });

        this.saveFileContent("/articles-history.json", JSON.stringify(history, null, 4));
    },
    setCreationDate: (articleName) => {
        const history = JSON.parse(this.getFileContent("/articles-history.json"));
        history[articleName] = {
            creation: new Date().toUTCString(),
            lastUpdate: null
        };
        this.saveFileContent("/articles-history.json", JSON.stringify(history, null, 4));
    },
    setEditionDate: (articleName) => {
        const history = JSON.parse(this.getFileContent("/articles-history.json"));
        history[articleName].lastUpdate = new Date().toUTCString();
        this.saveFileContent("/articles-history.json", JSON.stringify(history, null, 4));
    }
};
