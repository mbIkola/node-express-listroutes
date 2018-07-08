const path = require('path');
const colors = require('colors/safe');

const options = {
    prefix: '',
    spacer: 7
};

const colorMethod = method => {
    switch (method) {
        case ('POST'): return colors.yellow(method);
        case ('GET'): return colors.green(method);
        case ('PUT'): return colors.blue(method);
        case ('DELETE'): return colors.red(method);
        case ('PATCH'): return colors.grey(method);
        default: return method ? method : '*';
    }
};

/**
 * Traverse through registered express routes and return them as string or output to console depending on opts
 *
 * @param opts
 * @param callback
 * @returns {Promise<any>}
 */
const listRoutes = (opts = {}, callback) => {
    const promise = new Promise((resolve, reject) => {
        const {prefix, router} = opts;
        const routes = [];
        const colorize = opts.colors === true ? colorMethod : method => method;

        if (!('stack' in router)) {
            reject(new Error('router is missing stack field.'));
        }

        router.stack.forEach(stack => {
            if (stack.route) {
                stack.route.stack.forEach(routePath => {
                    const method = routePath.method ? routePath.method.toUpperCase() : null;
                    if (method) {
                        routes.push({
                            method,
                            path: path.join('/', prefix, stack.route.path)
                        });
                    }
                });
            }
        });

        if (opts.return === 'string' || !opts.return) {
            const newRoutes = routes.map(route => {
                const spacer = Array(options.spacer - route.method.length).join(' ');
                return colorize(route.method) + spacer + route.path;
            });
            let uniqRoutes = [...new Set(newRoutes)];
            const title = opts.title ? colors.magenta(opts.title) + '\n' : '';

            resolve(title + uniqRoutes.join('\n'));
        } else {
            resolve(routes);
        }
    });

    if (callback && typeof callback === 'function') {
        promise.then(callback);
    }

    return promise;
};

module.exports = listRoutes;
