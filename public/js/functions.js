
var selected_file;
var text = "";
var ranges = {};
var selected_line = null;
var line_element = null;

var method_declaration_color;
var variable_declaration_color;
var method_call_color;
var initializer_declaration_color;

var method_call_switch;
var variable_declaration_switch;
var method_declaration_switch;
var initializer_declaration_switch;

var line_array = [];

/**
 * action of load button
 */
function load_button() {
    var selected = $("#java_file_select").val();
    selected_file = selected;
    //console.log("loading selection: " + selected);
    // run ajax request to server
    $.ajax({
        url: "get_file",
        type: "POST",
        data: {file: selected},
        success: (data) => {
            //console.log(data);
            text = data.data;
            ranges = $.parseJSON(data.ranges);
            // run current color setting on load (makes only sense, when loading a new java file with activated checkboxes)
            display_text()
            color_switch();
        },
        error: (err) => {
            console.log(err);
        }
    });
}

/**
 * get the colors of the color input boxes and run code coloring
 */
function set_selection_color() {
    // get the value of the input boxes for coloring
    var method_decl_input = $("#methodDeclColor");
    var variable_decl_input = $("#variableDeclColor");
    var method_call_input = $("#methodCallColor");
    var initializer_decl_input = $("#initializerDeclColor");
    method_declaration_color = method_decl_input.val();
    variable_declaration_color = variable_decl_input.val();
    method_call_color = method_call_input.val();
    initializer_declaration_color = initializer_decl_input.val()
    // set the color of the input boxes to their colors respectively
    method_decl_input.css({"background-color": method_declaration_color});
    variable_decl_input.css({"background-color": variable_declaration_color});
    method_call_input.css({"background-color": method_call_color});
    initializer_decl_input.css({"background-color": initializer_declaration_color});
    // run th code coloring
    color_switch();
}

/**
 * action for the checkboxes which sets global node type switches
 */
function color_switch() {
    if ($("#methodDeclSwitch").is(":checked")) method_declaration_switch = true;
    else method_declaration_switch = false;
    if ($("#variableDeclSwitch").is(":checked")) variable_declaration_switch = true;
    else variable_declaration_switch = false;
    if ($("#methodCallSwitch").is(":checked")) method_call_switch = true;
    else method_call_switch = false;
    if ($("#initializerSwitch").is(":checked")) initializer_declaration_switch = true;
    else initializer_declaration_switch = false;
    // redraw the text
    display_text();
    // run colors
    set_text_color();
}

/**
 * display the source code
 */
function display_text() {
    // put all lines into an array
    line_array = []
    lines = text.split("\n");
    // put all characters into an nested array
    lines.forEach(line => {
        line_array.push(line.split(''));
    });

    // clear line and code div
    $("#code_div").empty();
    $("#line_div").empty();
    // run over all lines
    for (l = 0; l < line_array.length; l++) {
        // add line number
        //$("#line_div").append("<span>" + (l+1) + "</span><br>");
        line = line_array[l];
        append = "<div class=\"code_line_container\" line=" + l + ">"
        append += "<div class=\"code_line_number\">" + (l + 1) + "</div>";
        append += "<div class=\"code_line_chars\">"
        // run over chars in the line
        for (c = 0; c < line.length; c++) {
            span_element = "<span ";
            span_element += "line=" + l + " "
            span_element += "column=" + c + " "
            span_element += " class=\"character_span ";
            // add class the current char is in to the span element
            if(line_column_is_in_range(ranges.MethodDeclaration, line, l, c)) {
                span_element += "MethodDeclaration ";
            }
            if(line_column_is_in_range(ranges.VariableDeclaration, line, l, c)) {
                span_element += "VariableDeclaration ";
            }
            if(line_column_is_in_range(ranges.MethodCall, line, l, c)) {
                span_element += "MethodCall ";
            }
            if(line_column_is_in_range_initializer(ranges.VariableInitializers, line, l, c)) {
                span_element += "InitializerDeclaration ";
            }
            span_element += "\">" + line[c] + "</span>";
            //line_element.append(span_element);
            //$(".code_line_container")
            //$("#code_div").append(span_element);
            append += span_element
        }
        append += "</div></div>";
        append += "<div class=\"clear\"></div>"
        $("#code_div").append(append);
        //$("#code_div").append("<br>");
    }
    // register span element listener
    // $("#code_div span").click(click_span_element);
    // $(".code_line_chars").click(click_span_element);
    $(".code_line_chars").on("click", (e) => {
        selected_line = e.target;
        click_span_element();
    });
}
function line_column_is_in_range_initializer(range_type, line, l, c) {
    // get all nodes which are no MethodCalls
    noMethodCalls = [];
    for (i=0; i<range_type.length; i++) {
        node = range_type[i];
        // ignore method call expressions for variable initializer since they are covered in method calls
        if(node.type != "com.github.javaparser.ast.expr.MethodCallExpr") {
            noMethodCalls.push(node.range);
        }
    }
    return line_column_is_in_range(noMethodCalls, line, l, c);
}
/**
 * check if the current character is in the range of the given range type
 * @param {*} range_type VariableDeclaration | MethodCall | VariableInitializer | MethodDeclaration
 * @param {*} line current line as array
 * @param {*} l line number
 * @param {*} c column number
 */
function line_column_is_in_range(range_type, line, l, c) {
    // iterate over all elements of the range
    for (i=0; i<range_type.length; i++) {
        element = range_type[i];

        // get the start index of the range element
        start = element.start;
        start_line = start.split(",")[0]-1;
        start_col = start.split(",")[1]-1;
        // get the end index of the range element
        end = element.end;
        end_line = end.split(",")[0]-1;
        end_col = end.split(",")[1]-1;

        start_c = 0;
        end_c = line.length-1
        if (l == start_line) start_c = start_col;
        if(l == end_line) end_c = end_col;

        // we are inside the range
        if (l > start_line && l < end_line) return true;
        // do we have a one liner?
        else if(l == start_line && l == end_line) {
            if (c >= start_c && c <= end_c) return true;
        }
        // are we in the first line?
        else if(l == start_line) {
            if (c >= start_c) return true;
        }
        // are we in the last line?
        else if(l == end_line) {
            if (c <= end_c) return true;
        }
    }
    return false;
}

/**
 * set the color of the activated classes
 */
function set_text_color() {
    if(method_declaration_switch) set_color_range("MethodDeclaration", method_declaration_color);
    if(variable_declaration_switch) set_color_range("VariableDeclaration", variable_declaration_color);
    if(method_call_switch) set_color_range("MethodCall", method_call_color);
    if(initializer_declaration_switch) set_color_range("InitializerDeclaration", initializer_declaration_color);
}
/**
 * generic function to change the color of the given css class
 * @param {*} class_name 
 * @param {*} color 
 */
function set_color_range(class_name, color) {
    $("."+class_name).css({"background-color": color});
}

/**
 * handles click on span elements
 */
function click_span_element() {
    if (selected_line == null) return;
    // get the clicked element
    line_number = $(selected_line).attr("line");
    if (line_element != null) {
        line_element.css({"border": "0px"});
    }
    line_element = $(".code_line_container [line="+line_number+"]").parent()

    line_element.css({"border": "1px solid black"});

    column_number = $(selected_line).attr("column");
    // get the current statement
    // fire ajax to server
    $.ajax({
        type: "POST",
        url: "get_prediction",
        data: {
            file: selected_file,
            line: line_number,
            column: column_number},
        success: (data) => {
            console.log(data);
            alert("predicted statement class: " + data);
        },
        error: (err) => {
            console.log(err);
        }
    });
}

function print(m) {
    console.log(m);
}

/**
 * onload function - register listeners, initialize colors and load text
 */
$(function() {
    set_selection_color();
    color_switch();
    $("#load_button").click(load_button);
    $("#load_button").trigger("click");
    $(".colorInput").change(set_selection_color);
    $(".colorSwitch").change(color_switch);
});

