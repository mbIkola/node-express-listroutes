const fs = require('fs');
const path = require('path');
const express = require('express');
const listRoutes = require('./listroutes');


/**
 * Idea is Spizheno.
 *
 * Main idea: each url hash corresponding controller in directory tree. Controller is responsive to register routes in Router,
 * which is passed as arg to its (controller) constructor.
 *
 * So, if controllersFolder == "./controllers" and directory tree looks like
 * ```
 *  controllers
 *  ├── api
 *  │   └── auth
 *  │       ├── authread.controller.js
 *  │       └── authwrite.controller.js
 *  └── charts+
 *      └── index.js
 * ```
 * then this script would scan entire controllers directory tree and try to instantate 3 classes:
 *  - class exported by default from authread.controller.js wich will be mounted at {basePath}/api/auth (by app.use(basePath + 'api/auth', new $controoler(new Router()))
 *  - class exported by default from authread.controller.js wich will be also mounted at {basePath}/api/auth
 *  - default class from charts/index.js mounted at "{basePath}/charts"
 *
 * Each exported class or function in controllers dir should be a Constructor. There are no more restrictions
 * @todo: dependency injection here probably ?
 * @warning: calling readFileSync inside. Expected it should be done only once during application bootstrap
 * @example:
 * // Instantiation
 * const app = express();
 * const Router = require('./lib/router');
 * const router = new Router(config.BASE_URL, path.join(__dirname, controllers));
 * router.load(app);
 *
 * // Writing controller: /controllers/api/something.js
 * class SomethingApiController {
 *     constructor(router, app) {
 *      router.get('/', function(req, res) {
 *         res.send("Hello world from SomethingApiController at "+ __dirname + __filename );
 *      });
 * }
 * module.exports = SomethingApiController
 *
 *
 */

class Router {

    constructor(baseRoute, controllersFolderPath) {
        this.controllersFolder = controllersFolderPath || __dirname;
        this.controllersFolder = path.normalize(this.controllersFolder);
        this.baseRoute = baseRoute || '/';
        this.baseRoute = this.baseRoute.replace(/(?:\/+)$/, '/'); // just a trimRight('/')

    }

    load(app, folderName ) {
        let p = [];
        this._load(app, folderName, (basePath, router) => {
            app.use(basePath, router);
            p.push(listRoutes({prefix: basePath, router: router, return: 'string'}));

        });

        return Promise.all(p)
            .then( res => res.map(i => (i === "" ? "*     /   [express-static]": i) ))
            .then( res => res.join('\n'))
    }

    _load(app, folderName, registerRoute ) {


        folderName = folderName || this.controllersFolder;

        fs.readdirSync(folderName).forEach((file) => {

            const fullName = path.join(folderName, file);
            const stat = fs.lstatSync(fullName);

            if (stat.isDirectory() ) {
                //Recursively walk-through folders
                this._load(app, fullName, registerRoute);

            } else if (file.toLowerCase().indexOf('.js')) {

                let relative = path.relative(this.controllersFolder, folderName);

                const router = express.Router(); //// we can generate typical get/post/put/head wrappers to track what is registered on the fly ?

                //Generate the route
                const baseRoute = this.baseRoute + relative;

                //Load the JavaScript file ("controller") and pass the router to it
                const controllerClass = require(fullName);
                new controllerClass(router, app);
                //Associate the route with the router
                registerRoute(baseRoute, router);
            }
        });
    }

}

module.exports = Router;
