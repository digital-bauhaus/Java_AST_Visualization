var express = require("express");
var handlebars = require("express-handlebars");
var formidable = require("formidable");
var fs = require('fs');
var path = require('path');
var exec = require('child_process').exec;

var args = process.argv.slice(2);

var target_folder = args[0];
console.log("run on folder: " + target_folder);
var java_files = [];
var selected_java_file = null;
process_input_folder(target_folder);




var app = express();

app.engine(".handlebars", handlebars({layout: false, extname: ".handlebars"}));
app.set("view engine", ".handlebars");
app.set('views', __dirname + '/views');

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded());

app.get("/", (req, res) => {
    res.render("index", {
        "java_folder_path": target_folder+"/",
        "option": java_files
    });
});
app.post("/get_file", (req, res) => {
    filename = req.body.file;
    console.log("collecting info for " + filename);
    selected_java_file = filename
    file_path = target_folder + "/" + filename;

    fs.readFile(file_path, 'utf8', (err, data) => {
        if (err) throw err;
        
        //res.send(data);
        //console.log(data);
        console.log("starting process");
        child = exec("/usr/bin/java -jar ./java_file_parser.jar " + file_path, (err, stdout, stderr) => {
            if(!err) {
                console.log(stdout);
                res.send({data: data, ranges: stdout});
            }
        });
    });
});

app.get("/:view", (req, res) => {
    var view = req.params.view;
    res.render(view, {"name": "Chuck norris"});
});

var server = app.listen(8187, () => {
    var host = server.address().address;
    var port = server.address().port;
    console.log("Example app listening at http://%s:%s", host, port);
});

function process_input_folder(path) {
    fs.readdir(path, (err, files) => {
        files.forEach(file => {
            java_files.push(file)
        });
        selected_java_file = java_files[0];
        console.log("selected java file: " + selected_java_file);
    });
}