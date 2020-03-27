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
      main: "index.js",
      module: "",
      types: "",
      unpkg: "",
      sideEffects: false,
      buildOptions: {
        name: "",
        formats: [
          "esm-bundler",
          "esm-bundler-runtime",
          "cjs",
          "global",
          "esm"
        ]
      },
      keywords: [],
      license: "MIT",
      homepage: "",
      author: {
        name: this.user.git.name(),
        email: this.user.git.email(),
        url: ""
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
        message: "package 名称"
      }
    ]);
    this.pkg.name = name;
    const targetDir = this.destinationPath("packages", name);
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
      if (action === "overwrite") {
        console.log(`\n移除目录 ${chalk.cyan(targetDir)}...`);
        await fs.remove(targetDir);
      }
    }
    this.destinationRoot(targetDir);
  }

  writing() {
    const homepage = this.pkg.homepage || `https://github.com/${this.pkg.author.name}/${this.pkg.name}`;
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
