# Book Reader

An Apache Cordova application to read books, to take annotations and to highlight text. It is still
in very early development and doesn't do much now.

## Licensing

The source code is under the MIT license. The source code itself doesn't include any Apache Cordova
code, making the MIT license the only license file you need to ship with the source code. However,
built applications include Apache Cordova code. Therefore, you must include the license file in the
shipped version.

## Dependencies

- Apache Cordova (the `cordova` command's parent folder must be in `PATH`, so that the command is
accessible)

## Building

Because there isn't any included Apache Cordova code, you must run `npm run gen` to add the
needed platforms and plugins. Before committing, `npm run clean` must be run for the Apache Cordova
code to be removed.