
var text = "";
var ranges = {};

var method_declaration_color;
var variable_declaration_color;
var method_call_color;
var initializer_declaration_color;

var method_call_switch;
var variable_declaration_switch;
var method_declaration_switch;
var initializer_declaration_switch;

var line_array = [];

function load_button() {
    var selected = $("#java_file_select").val();
    console.log("loading selection: " + selected);
    $.ajax({
        url: "get_file",
        type: "POST",
        data: {file: selected},
        success: (data) => {
            console.log(data);
            text = data.data;
            //console.log(data.ranges);
            ranges = $.parseJSON(data.ranges);
            color_switch();
        },
        error: (err) => {
            console.log(err);
        }
    });
    
}


function set_selection_color() {
    var method_decl_input = $("#methodDeclColor");
    var variable_decl_input = $("#variableDeclColor");
    var method_call_input = $("#methodCallColor");
    var initializer_decl_input = $("#initializerDeclColor");
    method_declaration_color = method_decl_input.val();
    variable_declaration_color = variable_decl_input.val();
    method_call_color = method_call_input.val();
    initializer_declaration_color = initializer_decl_input.val()
    method_decl_input.css({"background-color": method_declaration_color});
    variable_decl_input.css({"background-color": variable_declaration_color});
    method_call_input.css({"background-color": method_call_color});
    initializer_decl_input.css({"background-color": initializer_declaration_color});
    color_switch();
}

function color_switch() {
    if ($("#methodDeclSwitch").is(":checked")) method_declaration_switch = true;
    else method_declaration_switch = false;
    if ($("#variableDeclSwitch").is(":checked")) variable_declaration_switch = true;
    else variable_declaration_switch = false;
    if ($("#methodCallSwitch").is(":checked")) method_call_switch = true;
    else method_call_switch = false;
    if ($("#initializerSwitch").is(":checked")) initializer_declaration_switch = true;
    else initializer_declaration_switch = false;
    display_text()
    set_text_color()
}

function display_text() {
    line_array = []
    lines = text.split("\n");
    lines.forEach(line => {
        line_array.push(line.split(''));
    });

    $("#code_div").empty();

    for (l = 0; l < line_array.length; l++) {
        line = line_array[l];
        for (c = 0; c < line.length; c++) {

            span_element = "<span ";
            span_element += "line=" + l + " "
            span_element += "column=" + c + " "
            span_element = "<span class=\"character_span ";
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
            span_element += "\">" + line[c] + "</span>"
            $("#code_div").append(span_element);
        }
        $("#code_div").append("<br>");
    }
}
function line_column_is_in_range_initializer(range_type, line, l, c) {

    // get all nodes which are no MethodCalls
    noMethodCalls = [];
    for (i=0; i<range_type.length; i++) {
        node = range_type[i];
        if(node.type != "com.github.javaparser.ast.expr.MethodCallExpr") {
            noMethodCalls.push(node.range);
        }
    }
    return line_column_is_in_range(noMethodCalls, line, l, c);

    // if(range_type.length == 0) return false;
    // node_type = range_type.type;
    // if (node_type != "com.github.javaparser.ast.expr.MethodCallExpr") {
    //     console.log(range_type)
    //     return line_column_is_in_range(range_type.range, l, c);
    // }
   //return false;
}

function line_column_is_in_range(range_type, line, l, c) {
    for (i=0; i<range_type.length; i++) {
        element = range_type[i];
        start_line_index = element.start.split(',')[0] - 1;
        start_character_index = element.start.split(',')[1] - 1;
        end_line_index = element.end.split(',')[0] - 1;
        end_character_index = element.end.split(',')[1];
        line_check = l >= start_line_index && l <= end_line_index;
        character_check = c >= start_character_index && c <= end_character_index

        start = element.start;
        start_line = start.split(",")[0]-1;
        start_col = start.split(",")[1]-1;
        end = element.end;
        end_line = end.split(",")[0]-1;
        end_col = end.split(",")[1]-1;

        start_c = 0;
        end_c = line.length-1
        if (l == start_line) start_c = start_col;
        if(l == end_line) end_c = end_col;

        if (l > start_line && l < end_line) return true;
        else if(l == start_line && l == end_line) {
            if (c >= start_c && c <= end_c) return true;
        }
        else if(l == start_line) {
            if (c >= start_c) return true;
        }
        else if(l == end_line) {
            if (c <= end_c) return true;
        }
    }
    return false;
}

function set_text_color() {
    if(method_declaration_switch) set_color_range("MethodDeclaration", method_declaration_color);
    if(variable_declaration_switch) set_color_range("VariableDeclaration", variable_declaration_color);
    if(method_call_switch) set_color_range("MethodCall", method_call_color);
    if(initializer_declaration_switch) set_color_range("InitializerDeclaration", initializer_declaration_color);

    //console.log(ranges.MethodDeclaration);
}

function set_color_range(class_name, color) {
    $("."+class_name).css({"background-color": color});
}

$(function() {
    set_selection_color();
    color_switch();
    $("#load_button").click(load_button);
    $("#load_button").trigger("click");
    $(".colorInput").change(set_selection_color);
    $(".colorSwitch").change(color_switch);
});

