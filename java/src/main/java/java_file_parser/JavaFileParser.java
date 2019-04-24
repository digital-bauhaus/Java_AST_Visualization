package java_file_parser;

import com.github.javaparser.JavaParser;
import com.github.javaparser.ParseResult;
import com.github.javaparser.Range;
import com.github.javaparser.ast.CompilationUnit;
import com.github.javaparser.ast.Node;
import com.github.javaparser.ast.NodeList;
import com.github.javaparser.ast.body.InitializerDeclaration;
import com.github.javaparser.ast.body.MethodDeclaration;
import com.github.javaparser.ast.body.VariableDeclarator;
import com.github.javaparser.ast.expr.Expression;
import com.github.javaparser.ast.expr.MethodCallExpr;
import com.github.javaparser.ast.expr.VariableDeclarationExpr;

import java.io.File;
import java.io.FileNotFoundException;
import java.util.List;
import java.util.Optional;

public class JavaFileParser {
    public static void main(String[] args) {
        assert args.length == 1;

        String file_path = args[0];
        //System.out.println(file_path);
        JavaParser parser = new JavaParser();
        try {
            ParseResult<CompilationUnit> parseResult = parser.parse(new File(file_path));
            if(!parseResult.isSuccessful() || !parseResult.getResult().isPresent()) {
                return;
            }
            CompilationUnit unit = parseResult.getResult().get();

            //System.out.println(TreeHelper.nodeToPrettyJson(unit));

            List<MethodDeclaration> methods = unit.findAll(MethodDeclaration.class);
            List<VariableDeclarationExpr> variableDeclarationExprs = unit.findAll(VariableDeclarationExpr.class);
            List<MethodCallExpr> methodCallExprs = unit.findAll(MethodCallExpr.class);
//            List<InitializerDeclaration> initializers = unit.findAll(InitializerDeclaration.class);

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

                //if(i != variableDeclarationExprs.size()-1) builder.append(",");
            }

            /*for(int i=0; i<variableDeclarationExprs.size(); i++) {
                VariableDeclarationExpr var = variableDeclarationExprs.get(i);

                builder = getRange(builder, var, "VariableDeclaration");
                if(i != variableDeclarationExprs.size()-1) builder.append(",");
            }*/

            /*builder.append("], \"InitializerDeclaration\": [");
            for(int i=0; i<initializers.size(); i++) {
                InitializerDeclaration initializerDeclaration = initializers.get(i);
                System.out.println(TreeHelper.nodeToPrettyJson(initializerDeclaration));
                builder = getRange(builder, initializerDeclaration, "InitializerDeclaration");
                if(i != initializers.size()-1) builder.append(",");
            }*/
            builder.append("]}");
            System.out.println(builder.toString());
        } catch (FileNotFoundException e) {
            e.printStackTrace();
        }
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
