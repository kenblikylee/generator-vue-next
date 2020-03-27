'use strict';
const Generator = require("yeoman-generator");
// const _ = require("lodash");
// const extend = _.merge;
const originUrl = require("git-remote-origin-url");
const chalk = require("chalk");
const copyTpls = require("../../utils/copyTpls");
const clearConsole = require("../../utils/clearConsole");
const fs = require("fs-extra");

/**
 * yeoman generator api
 * 
 * - option(name, config): Adds an option to the set of generator expected options, only used to generate generator usage. 
 * - destinationPath(…dest): Join a path to the destination root.
 * - destinationRoot(rootPath): Change or read the generator destination root directory.
 * - templatePath(…dest): Join a path to the source root.
 * - sourceRoot(rootPath): Change or read the generator source root directory.
 * - prompt(questions): Prompt user to answer questions. Same to Inquirer.js.
 * - yarnInstall(pkgsopt, optionsopt, spawnOptionsopt)
 * - npmInstall(pkgsopt, optionsopt, spawnOptionsopt)
 * - installDependencies(optionsopt)
 * - composeWith(generator, optionsopt, returnNewGeneratoropt): Compose this generator with another one.
 * - fs: https://github.com/sboudrias/mem-fs-editor
 */

module.exports = class extends Generator {
  constructor(args, options) {
    super(args, options);
  }

  async initializing() {
    this.pkg = {
      name: "",
      description: "",
      version: "1.0.0-alpha",
      private: true,
      workspaces: ["packages/*"],
      scripts: {
        dev: "node scripts/dev.js",
        build: "node scripts/build.js",
        size: "node scripts/build.js vue runtime-dom size-check -p -f global",
        lint: "prettier --write --parser typescript \"packages/**/*.ts?(x)\"",
        "ls-lint": "ls-lint",
        test: "node scripts/build.js vue -f global -d && jest",
        "test-dts": "node scripts/build.js shared reactivity runtime-core runtime-dom -dt -f esm-bundler && tsd",
        release: "node scripts/release.js",
        changelog: "conventional-changelog -p angular -i CHANGELOG.md -s",
        "dev-compiler": "npm-run-all --parallel \"dev template-explorer\" serve",
        serve: "serve",
        open: "open http://localhost:5000/packages/template-explorer/local.html"
      },
      types: "test-dts/index.d.ts",
      tsd: {
        directory: "test-dts"
      },
      gitHooks: {
        "pre-commit": "ls-lint && lint-staged",
        "commit-msg": "node scripts/verifyCommit.js"
      },
      "lint-staged": {
        "*.js": [
          "prettier --write",
          "git add"
        ],
        "*.ts?(x)": [
          "prettier --parser=typescript --write",
          "git add"
        ]
      },
      devDependencies: {
        "@microsoft/api-extractor": "^7.3.9",
        "@rollup/plugin-commonjs": "^11.0.2",
        "@rollup/plugin-json": "^4.0.0",
        "@rollup/plugin-node-resolve": "^7.1.1",
        "@rollup/plugin-replace": "^2.2.1",
        "@types/jest": "^24.0.21",
        "@types/puppeteer": "^2.0.0",
        "brotli": "^1.3.2",
        "chalk": "^2.4.2",
        "conventional-changelog-cli": "^2.0.31",
        "csstype": "^2.6.8",
        "enquirer": "^2.3.2",
        "execa": "^2.0.4",
        "fs-extra": "^8.1.0",
        "jest": "^24.9.0",
        "lint-staged": "^9.2.3",
        "minimist": "^1.2.0",
        "npm-run-all": "^4.1.5",
        "prettier": "~1.14.0",
        "puppeteer": "^2.0.0",
        "rollup": "^1.19.4",
        "rollup-plugin-terser": "^5.1.1",
        "rollup-plugin-typescript2": "^0.24.0",
        "semver": "^6.3.0",
        "serve": "^11.3.0",
        "ts-jest": "^24.0.2",
        "tsd": "^0.11.0",
        "typescript": "^3.7.0",
        "yorkie": "^2.0.0",
        "@ls-lint/ls-lint": "^1.8.0"
      },
      keywords: [],
      license: "MIT",
      homepage: "https://github.com//",
      author: {
        name: this.user.git.name(),
        email: this.user.git.email(),
        url: "https://github.com//"
      }
    };

    return originUrl(this.destinationRoot())
      .then(url => {
        this.pkg.homepage = url;
      })
      .catch(() => {
        this.pkg.homepage = "";
      });
  }

  async prompting() {
    const { name } = await this.prompt([
      {
        type: "input",
        name: "name",
        message: "项目名称",
        default: this.appname
      }
    ]);
    this.pkg.name = name;
    if (name === this.appname) {
      const { ok } = await this.prompt([
        {
          name: "ok",
          type: "confirm",
          message: "确认在当前目录创建新项目?"
        }
      ]);
      if (ok) {
        return
      }
    }
    const targetDir = this.destinationPath(name);
    if (fs.existsSync(targetDir)) {
      clearConsole();
      const { action } = await this.prompt([
        {
          name: "action",
          type: "list",
          message: `目标目录 ${chalk.cyan(targetDir)} 已存在，如何处理？`,
          choices: [
            { name: "重写", value: "overwrite" },
            { name: "融合", value: "merge" },
            { name: "取消", value: false }
          ]
        }
      ]);
      if (!action) {
        return;
      } else if (action === "overwrite") {
        console.log(`\n移除目录 ${chalk.cyan(targetDir)}...`);
        await fs.remove(targetDir);
      }
    }
    this.destinationRoot(this.destinationPath(name));
  }

  writing() {
    const homepage = `https://github.com/${this.pkg.author.name}/${this.pkg.name}`;
    this.pkg.homepage = homepage;
    this.pkg.author.url = homepage;
    copyTpls.call(this, p => this.destinationPath(p), {
      name: this.pkg.name,
      author: this.pkg.author.name,
      githubUrl: homepage
    });
    this.fs.writeJSON(this.destinationPath("package.json"), this.pkg);
  }

  install() {
    // this.yarnInstall();
  }
};
