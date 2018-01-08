# ggb-plot

Automated geometrical construction and highlighting experiments based on GeoGebra [Math Apps Bundle][Math_Apps] and JavaScript.

## Features

- GeoGebra automated highlight functions used for geometric questions demonstration synchronously.
- GeoGebra automated construction from the text of geometric questions.
- Built-in automatic unit testings.

## Install

- Install NodeJS and Google Chrome.

If used in China, install the NPM source:

```
npm config set registry "https://registry.npm.taobao.org"
```

- Install the components required for this project:

```
sudo npm i -g grunt-cli
npm i
```

- Copy `webSimple` folder from GeoGebra [Math Apps Bundle][Math_Apps] to `data` of this project.

## Build

- Run `grunt serve` to develop with Google Chrome.
- Run `grunt build` to release on Web site.

## Test

- Run `npm test` for unit testing.

## License

This project is licensed under the GNU General Public License version 3.0 (GPLv3).

[Math_Apps]: https://wiki.geogebra.org/en/Reference:Math_Apps_Embedding
