var express = require("express");
var handlebars = require("express-handlebars");
var formidable = require("formidable");
var fs = require('fs');
var path = require('path');
var exec = require('child_process').exec;
var spawn = require('child_process').spawn;

var args = process.argv.slice(2);

var target_folder = args[0];
console.log("run on folder: " + target_folder);
var java_files = [];
var selected_java_file = null;
process_input_folder(target_folder);

var python_env_path = "/home/andre/virtualenvs/pytorch/bin/python3"
//var python_script_path = "/home/andre/Github/MLPipeline"
var python_script_path = args[1]
var python_script_name = "run_trained_classifier_pre_text.py"


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
        child = exec("/usr/bin/java -jar ./java_file_parser.jar get_ranges " + file_path, (err, stdout, stderr) => {
            if(!err) {
                console.log(stdout);
                res.send({data: data, ranges: stdout});
            }
        });
    });
});


app.post("/get_prediction", (req, res) => {
    console.log("incoming request")
    file = req.body.file;
    line = req.body.line;
    col  = req.body.column;
    //console.log(file + " " + line + " " + col)
    file_path = target_folder + "/" + filename;
    // get the text of the method before that statement
    // give the text to the classifier
    //java_command = "/usr/bin/java -jar ./java_file_parser.jar get_method_text " + file_path + " " + line + " " + col;
    //python_command = python_env_path + " " + python_script_path + " SourceCodeUntilCurrentStatement RF";
    //console.log(java_command);


    var java_response;
    var python_response;

    var java_child = spawn("/usr/bin/java", ["-jar", "java_file_parser.jar", "get_method_text", file_path, line, col], {cwd: '.'});
    java_child.stdout.on('data', (data) => {
        console.log('data: ' + data);

        java_response = data;

        java_process_response = data;
        java_child.kill();
    });
    java_child.stderr.on("data", (err) => {
        console.log(err);
        //res.sendStatus(500);
        //return;
    });
    java_child.on("exit", () => {
        python_child = spawn(python_env_path,
            [python_script_name, "SourceCodeUntilCurrentStatement", "RF", "\""+java_response+"\""],
            {cwd: python_script_path});
        python_child.stdout.on('data', (python_data) => {
            console.log("python response: " + python_data);
            python_response = python_data;
            // res.write("<p>"+response+"</p>");
            // res.end();
        });
        python_child.on("exit", () => {
            //console.log("exiting python");
            res.send(python_response);
        })
    });
    //res.send({data: response});
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