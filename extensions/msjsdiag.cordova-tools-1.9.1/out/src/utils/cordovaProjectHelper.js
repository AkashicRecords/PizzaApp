"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
Object.defineProperty(exports, "__esModule", { value: true });
const child_process = require("child_process");
const fs = require("fs");
const path = require("path");
const Q = require("q");
const semver = require("semver");
const os = require("os");
class CordovaProjectHelper {
    /**
     *  Helper function check if a file exists.
     */
    static existsSync(path) {
        try {
            // Attempt to get the file stats
            fs.statSync(path);
            return true;
        }
        catch (error) {
            return false;
        }
    }
    /**
     *  Helper (synchronous) function to create a directory recursively
     */
    static makeDirectoryRecursive(dirPath) {
        let parentPath = path.dirname(dirPath);
        if (!CordovaProjectHelper.existsSync(parentPath)) {
            CordovaProjectHelper.makeDirectoryRecursive(parentPath);
        }
        fs.mkdirSync(dirPath);
    }
    /**
     *  Helper (synchronous) function to delete a directory recursively
     */
    static deleteDirectoryRecursive(dirPath) {
        if (fs.existsSync(dirPath)) {
            if (fs.lstatSync(dirPath).isDirectory()) {
                fs.readdirSync(dirPath).forEach(function (file) {
                    let curPath = path.join(dirPath, file);
                    CordovaProjectHelper.deleteDirectoryRecursive(curPath);
                });
                fs.rmdirSync(dirPath);
            }
            else {
                fs.unlinkSync(dirPath);
            }
        }
    }
    /**
     *  Helper function to asynchronously copy a file
     */
    static copyFile(from, to, encoding) {
        let deferred = Q.defer();
        let destFile = fs.createWriteStream(to, { encoding: encoding });
        let srcFile = fs.createReadStream(from, { encoding: encoding });
        destFile.on("finish", function () {
            deferred.resolve({});
        });
        destFile.on("error", function (e) {
            deferred.reject(e);
        });
        srcFile.on("error", function (e) {
            deferred.reject(e);
        });
        srcFile.pipe(destFile);
        return deferred.promise;
    }
    /**
     *  Helper function to get the list of plugins installed for the project.
     */
    static getInstalledPlugins(projectRoot) {
        let fetchJsonPath = path.resolve(projectRoot, CordovaProjectHelper.PROJECT_PLUGINS_DIR, CordovaProjectHelper.PLUGINS_FETCH_FILENAME);
        if (!CordovaProjectHelper.existsSync(fetchJsonPath)) {
            return [];
        }
        try {
            let fetchJsonContents = fs.readFileSync(fetchJsonPath, "utf8");
            let fetchJson = JSON.parse(fetchJsonContents);
            return Object.keys(fetchJson);
        }
        catch (error) {
            console.error(error);
            return [];
        }
    }
    /**
     *  Helper function to get the list of platforms installed for the project.
     */
    static getInstalledPlatforms(projectRoot) {
        let platformsPath = path.resolve(projectRoot, CordovaProjectHelper.PLATFORMS_PATH);
        if (!CordovaProjectHelper.existsSync(platformsPath)) {
            return [];
        }
        try {
            let platformsDirContents = fs.readdirSync(platformsPath);
            return platformsDirContents.filter((platform) => {
                return platform.charAt(0) !== ".";
            });
        }
        catch (error) {
            console.error(error);
            return [];
        }
    }
    static getInstalledPluginDetails(projectRoot, pluginId) {
        let packageJsonPath = path.resolve(projectRoot, CordovaProjectHelper.PROJECT_PLUGINS_DIR, pluginId, "package.json");
        if (!CordovaProjectHelper.existsSync(packageJsonPath)) {
            return null;
        }
        try {
            let packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
            let details = {
                PluginId: packageJson.name,
                Version: packageJson.version,
                PluginType: CordovaProjectHelper.CORE_PLUGIN_LIST.indexOf(pluginId) >= 0 ? "Core" : "Npm",
            };
            return details;
        }
        catch (error) {
            console.error(error);
            return null;
        }
    }
    /**
     *  Helper to find the root of the Cordova project. Returns null in the case of directories which are
     *  not cordova-based projects. Otherwise, returns the project root path as a string.
     */
    static getCordovaProjectRoot(workspaceRoot) {
        let parentPath;
        let projectRoot = workspaceRoot;
        let atFsRoot = false;
        while (!CordovaProjectHelper.existsSync(path.join(projectRoot, CordovaProjectHelper.CONFIG_XML_FILENAME))
            && !CordovaProjectHelper.existsSync(path.join(projectRoot, CordovaProjectHelper.CONFIG_IONIC_FILENAME))) {
            // Navigate up one level until either config.xml is found
            parentPath = path.resolve(projectRoot, "..");
            if (parentPath !== projectRoot) {
                projectRoot = parentPath;
            }
            else {
                // we have reached the filesystem root
                atFsRoot = true;
                break;
            }
        }
        if (atFsRoot) {
            // We reached the fs root, so the project path passed was not a Cordova-based project directory
            return null;
        }
        return projectRoot;
    }
    /**
     *  Helper function to get the target path for the type definition files (to be used for Cordova plugin intellisense).
     *  Creates the target path if it does not exist already.
     */
    static getOrCreateTypingsTargetPath(projectRoot) {
        if (projectRoot) {
            let targetPath = path.resolve(projectRoot, CordovaProjectHelper.VSCODE_DIR, CordovaProjectHelper.PROJECT_TYPINGS_FOLDERNAME);
            if (!CordovaProjectHelper.existsSync(targetPath)) {
                CordovaProjectHelper.makeDirectoryRecursive(targetPath);
            }
            return targetPath;
        }
        return null;
    }
    /**
     *  Helper function to get the path to Cordova plugin type definitions folder
     */
    static getCordovaPluginTypeDefsPath(projectRoot) {
        return path.resolve(CordovaProjectHelper.getOrCreateTypingsTargetPath(projectRoot), CordovaProjectHelper.PROJECT_TYPINGS_CORDOVA_FOLDERNAME, CordovaProjectHelper.PROJECT_TYPINGS_PLUGINS_FOLDERNAME);
    }
    /**
     *  Helper function to get the path to Ionic plugin type definitions folder
     */
    static getIonicPluginTypeDefsPath(projectRoot) {
        return path.resolve(CordovaProjectHelper.getOrCreateTypingsTargetPath(projectRoot), CordovaProjectHelper.PROJECT_TYPINGS_CORDOVA_IONIC_FOLDERNAME, CordovaProjectHelper.PROJECT_TYPINGS_PLUGINS_FOLDERNAME);
    }
    /**
     * Helper function to determine whether the project is an Ionic 1 or 2 project or not
     */
    static isIonicProject(projectRoot) {
        return CordovaProjectHelper.isIonic1Project(projectRoot) || CordovaProjectHelper.isIonic2Project(projectRoot) || CordovaProjectHelper.isIonic4Project(projectRoot);
    }
    /**
     *  Helper function to determine whether the project is an Ionic 1 project or no
     */
    static isIonic1Project(projectRoot) {
        // First look for "ionic.project" at the project root
        if (fs.existsSync(path.join(projectRoot, CordovaProjectHelper.IONIC_PROJECT_FILE))) {
            return true;
        }
        // If not found, fall back to looking for "www/lib/ionic" folder. This isn't a 100% guarantee though: an Ionic project doesn't necessarily have an "ionic.project" and could have the Ionic lib
        // files in a non-default location
        return fs.existsSync(path.join(projectRoot, CordovaProjectHelper.IONIC_LIB_DEFAULT_PATH));
    }
    /**
     *  Helper function to determine whether the project is an Ionic 2 project or no. NOTE: we currently rely on "ionic.config.js" file, which may change as Ionic 2 continues development.
     */
    static isIonic2Project(projectRoot) {
        const packageJsonPath = path.join(projectRoot, "package.json");
        if (!fs.existsSync(packageJsonPath)) {
            return false;
        }
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
        const dependencies = packageJson.dependencies || {};
        const devDependencies = packageJson.devDependencies || {};
        const highestNotSupportedIonic2BetaVersion = "2.0.0-beta.9";
        if ((dependencies["ionic-angular"]) && (devDependencies["@ionic/app-scripts"] || dependencies["@ionic/app-scripts"])) {
            const ionicVersion = dependencies["ionic-angular"];
            // Assuming for now that latest version is > 3
            if (ionicVersion === "latest" || ionicVersion === "nightly") {
                return true;
            }
            // If it's a valid version let's check it's greater than 2.0.0-beta-9
            if (semver.valid(ionicVersion)) {
                return semver.gt(ionicVersion, highestNotSupportedIonic2BetaVersion);
            }
            // If it's a valid range we check that the entire range is greater than 2.0.0-beta-9
            if (semver.validRange(ionicVersion)) {
                return semver.ltr(highestNotSupportedIonic2BetaVersion, ionicVersion);
            }
        }
        return false;
    }
    static isIonic4Project(projectRoot) {
        const packageJsonPath = path.join(projectRoot, "package.json");
        if (!fs.existsSync(packageJsonPath)) {
            return false;
        }
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
        const dependencies = packageJson.dependencies || {};
        const devDependencies = packageJson.devDependencies || {};
        const highestNotSupportedIonic4Version = "4.0.0-alpha.14";
        if ((dependencies["@ionic/angular"]) && (devDependencies["@ionic-native/core"] || dependencies["@ionic-native/core"])) {
            const ionicVersion = dependencies["@ionic/angular"];
            // Assuming for now that latest version is > 3
            if (ionicVersion === "latest" || ionicVersion === "nightly") {
                return true;
            }
            if (semver.valid(ionicVersion)) {
                return semver.gte(ionicVersion, highestNotSupportedIonic4Version);
            }
            if (semver.validRange(ionicVersion)) {
                return semver.ltr(highestNotSupportedIonic4Version, ionicVersion);
            }
        }
        return false;
    }
    /**
     * Helper function to determine whether the project has a tsconfig.json
     * manifest and can be considered as a typescript project.
     */
    static isTypescriptProject(projectRoot) {
        return fs.existsSync(path.resolve(projectRoot, "tsconfig.json"));
    }
    static getCliCommand(fsPath) {
        const cliName = CordovaProjectHelper.isIonicProject(fsPath) ? "ionic" : "cordova";
        const commandExtension = os.platform() === "win32" ? ".cmd" : "";
        const command = cliName + commandExtension;
        return command;
    }
    static getIonicCliVersion(fsPath, command = CordovaProjectHelper.getCliCommand(fsPath)) {
        const ionicInfo = child_process.spawnSync(command, ["-v", "--quiet"], {
            cwd: fsPath,
            env: Object.assign({}, process.env, { CI: "Hack to disable Ionic autoupdate prompt" }),
        });
        let parseVersion = /\d+\.\d+\.\d+/.exec(ionicInfo.stdout.toString());
        return parseVersion[0].trim();
    }
    /**
     * Checks if ionic cli version is being used greater than specified version using semver.
     * @param fsPath directory to use for running command
     * @param version version to compare
     * @param command multiplatform command to use
     */
    static isIonicCliVersionGte(fsPath, version, command = CordovaProjectHelper.getCliCommand(fsPath)) {
        try {
            const ionicVersion = CordovaProjectHelper.getIonicCliVersion(fsPath, command);
            return semver.gte(ionicVersion, version);
        }
        catch (err) {
            console.error("Error while detecting Ionic CLI version", err);
        }
        return true;
    }
    static isIonicCliVersionGte3(fsPath, command = CordovaProjectHelper.getCliCommand(fsPath)) {
        return CordovaProjectHelper.isIonicCliVersionGte(fsPath, "3.0.0", command);
    }
    static getEnvArgument(launchArgs) {
        let args = Object.assign({}, launchArgs);
        let env = process.env;
        if (args.envFile) {
            let buffer = fs.readFileSync(args.envFile, "utf8");
            // Strip BOM
            if (buffer && buffer[0] === "\uFEFF") {
                buffer = buffer.substr(1);
            }
            buffer.split("\n").forEach((line) => {
                const r = line.match(/^\s*([\w\.\-]+)\s*=\s*(.*)?\s*$/);
                if (r !== null) {
                    const key = r[1];
                    if (!env[key]) { // .env variables never overwrite existing variables
                        let value = r[2] || "";
                        if (value.length > 0 && value.charAt(0) === "\"" && value.charAt(value.length - 1) === "\"") {
                            value = value.replace(/\\n/gm, "\n");
                        }
                        env[key] = value.replace(/(^['"]|['"]$)/g, "");
                    }
                }
            });
        }
        if (args.env) {
            // launch config env vars overwrite .env vars
            for (let key in args.env) {
                if (args.env.hasOwnProperty(key)) {
                    env[key] = args.env[key];
                }
            }
        }
        return env;
    }
}
CordovaProjectHelper.PROJECT_TYPINGS_FOLDERNAME = "typings";
CordovaProjectHelper.PROJECT_TYPINGS_PLUGINS_FOLDERNAME = "plugins";
CordovaProjectHelper.PROJECT_TYPINGS_CORDOVA_FOLDERNAME = "cordova";
CordovaProjectHelper.PROJECT_TYPINGS_CORDOVA_IONIC_FOLDERNAME = "cordova-ionic";
CordovaProjectHelper.VSCODE_DIR = ".vscode";
CordovaProjectHelper.PLATFORMS_PATH = "platforms";
CordovaProjectHelper.PLUGINS_FETCH_FILENAME = "fetch.json";
CordovaProjectHelper.CONFIG_XML_FILENAME = "config.xml";
CordovaProjectHelper.PROJECT_PLUGINS_DIR = "plugins";
CordovaProjectHelper.IONIC_PROJECT_FILE = "ionic.project";
CordovaProjectHelper.CONFIG_IONIC_FILENAME = "ionic.config.json";
CordovaProjectHelper.IONIC_LIB_DEFAULT_PATH = path.join("www", "lib", "ionic");
CordovaProjectHelper.CORE_PLUGIN_LIST = ["cordova-plugin-battery-status",
    "cordova-plugin-camera",
    "cordova-plugin-console",
    "cordova-plugin-contacts",
    "cordova-plugin-device",
    "cordova-plugin-device-motion",
    "cordova-plugin-device-orientation",
    "cordova-plugin-dialogs",
    "cordova-plugin-file",
    "cordova-plugin-file-transfer",
    "cordova-plugin-geolocation",
    "cordova-plugin-globalization",
    "cordova-plugin-inappbrowser",
    "cordova-plugin-media",
    "cordova-plugin-media-capture",
    "cordova-plugin-network-information",
    "cordova-plugin-splashscreen",
    "cordova-plugin-statusbar",
    "cordova-plugin-vibration",
    "cordova-plugin-ms-azure-mobile-apps",
    "cordova-plugin-hockeyapp",
    "cordova-plugin-code-push",
    "cordova-plugin-bluetoothle",
    "phonegap-plugin-push",
    "cordova-plugin-ms-azure-mobile-engagement",
    "cordova-plugin-whitelist",
    "cordova-plugin-crosswalk-webview",
    "cordova-plugin-ms-adal",
    "com-intel-security-cordova-plugin",
    "cordova-sqlite-storage",
    "cordova-plugin-ms-intune-mam"];
exports.CordovaProjectHelper = CordovaProjectHelper;

//# sourceMappingURL=cordovaProjectHelper.js.map
