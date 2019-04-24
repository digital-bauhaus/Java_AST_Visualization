## Java AST Visualization

This tool is a quick helper to visualize different AST Node types of the Java programming language.

## Requirements
- Node JS
- Java 11 JDK
- Gradle

## How to run
- create and link the jar file:
```
cd java
./gradlew jar
cd ..
ln -s java/build/lib/java_file_parser-1.0-SNAPSHOT.jar ./java_file_parser.jar
```
- install the dependencies of the node server:
```
npm install
```
- run the server:
```
node server.js
```