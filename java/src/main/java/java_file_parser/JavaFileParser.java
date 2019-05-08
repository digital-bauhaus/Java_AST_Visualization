package java_file_parser;

import com.github.javaparser.JavaParser;
import com.github.javaparser.ParseResult;
import com.github.javaparser.Range;
import com.github.javaparser.ast.CompilationUnit;
import com.github.javaparser.ast.Node;
import com.github.javaparser.ast.NodeList;
import com.github.javaparser.ast.body.MethodDeclaration;
import com.github.javaparser.ast.body.VariableDeclarator;
import com.github.javaparser.ast.expr.Expression;
import com.github.javaparser.ast.expr.MethodCallExpr;
import com.github.javaparser.ast.expr.VariableDeclarationExpr;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class JavaFileParser {
    public static void main(String[] args) {
        assert args.length >= 2;
        if(args[0].equals("get_ranges")) {
            // first part -> get the ranges for AST Node elements of the given Java file
            String file_path = args[1];
            getRanges(file_path);
        }
        else if(args[0].equals("get_method_text")) {
            // second part -> get the text of the source code of the given position beforehand
            String file_path = args[1];
            int line_number = Integer.valueOf(args[2]);
            int column_number = Integer.valueOf(args[3]);
            //System.out.println(file_path + " " + line_number + " " + column_number);
            get_method_text(file_path, line_number, column_number);
        }
    }

    private static void get_method_text(String file_path, int line, int column) {
        CompilationUnit unit = JavaFileParser.getUnit(file_path);
        List<MethodDeclaration> methods = unit.findAll(MethodDeclaration.class);

        for(MethodDeclaration m : methods) {
            Optional<Range> opRange = m.getRange();
            if(!opRange.isPresent()) continue;;
            Range range = opRange.get();

            List<String> lines = getLines(file_path);

            if(range.begin.line <= line && range.end.line >= line) {
                String result = "";
//                System.out.println(range.begin.line);
                for(int i = range.begin.line-1; i < line; i++) {
                    result += lines.get(i) + "\n";
                }
                System.out.println(result);
                break;
            }
        }
    }


    private static List<String> getLines(String file_path) {
        List<String> result = new ArrayList<>();
        try {
            File f = new File(file_path);
            result = Files.readAllLines(f.toPath());
        } catch (IOException e) {}
        return result;
    }


    private static void getRanges(String file_path) {
        CompilationUnit unit = JavaFileParser.getUnit(file_path);

        List<MethodDeclaration> methods = unit.findAll(MethodDeclaration.class);
        List<VariableDeclarationExpr> variableDeclarationExprs = unit.findAll(VariableDeclarationExpr.class);
        List<MethodCallExpr> methodCallExprs = unit.findAll(MethodCallExpr.class);

        StringBuilder builder = new StringBuilder();

        builder.append("{");
        builder.append("\"MethodDeclaration\": [");
        for(int i=0; i<methods.size(); i++) {
            MethodDeclaration method = methods.get(i);
            //System.out.println(TreeHelper.nodeToJson(method));
            builder = getRange(builder, method);
            if(i != methods.size()-1) builder.append(",");
        }
        builder.append("], \"VariableDeclaration\": [");
        for(int i=0; i<variableDeclarationExprs.size(); i++) {
            VariableDeclarationExpr var = variableDeclarationExprs.get(i);
            builder = getRange(builder, var);
            if(i != variableDeclarationExprs.size()-1) builder.append(",");
        }
        builder.append("], \"MethodCall\": [");
        for(int i=0; i<methodCallExprs.size(); i++) {
            MethodCallExpr call = methodCallExprs.get(i);
            builder = getRange(builder, call);
            if(i != methodCallExprs.size()-1) builder.append(",");
        }
        builder.append("], \"VariableInitializers\": [");
        for(int i=0; i<variableDeclarationExprs.size(); i++) {
            VariableDeclarationExpr expr = variableDeclarationExprs.get(i);

            NodeList<VariableDeclarator> variables = expr.getVariables();
            for(VariableDeclarator variable : variables) {
                Optional<Expression> initializerOpt = variable.getInitializer();
                if(!initializerOpt.isPresent()) continue;
                Expression initializer = initializerOpt.get();
                String initializerType = initializer.getClass().getTypeName();
                builder.append("{");
                builder.append("\"type\": \"" + initializerType + "\",");
                builder.append("\"range\": ");
                builder = getRange(builder, initializer);
                builder.append("},");
            }
            if(i == variableDeclarationExprs.size()-1)
                builder.deleteCharAt(builder.length()-1);
        }
        builder.append("]}");
        System.out.println(builder.toString());
    }

    private static CompilationUnit getUnit(String file_path) {
        CompilationUnit unit = new CompilationUnit();
        JavaParser parser = new JavaParser();
        try {
            ParseResult<CompilationUnit> parseResult = parser.parse(new File(file_path));
            if (parseResult.isSuccessful() && parseResult.getResult().isPresent()) {
                unit = parseResult.getResult().get();
            }
        } catch (FileNotFoundException e) {
            e.printStackTrace();
        }
        return unit;
    }

    private static StringBuilder getRange(StringBuilder builder, Node node) {
        Optional<Range> optRange = node.getRange();
        if(!optRange.isPresent()) return builder;
        Range range = optRange.get();
        int startLineNumber = range.begin.line;
        int startColumnNumber = range.begin.column;

        int endLineNumber = range.end.line;
        int endColumnNumber = range.end.column;

        builder.append("{");
        builder.append("\"start\":\"" + startLineNumber + "," + startColumnNumber + "\"");
        builder.append(",");
        builder.append("\"end\":\"" + endLineNumber + "," + endColumnNumber + "\"");
        builder.append("}");
        //System.out.println(stringBuilder.toString());
        return builder;
    }
}
