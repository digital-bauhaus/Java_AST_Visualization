package java_file_parser;

import com.github.javaparser.ast.Node;
import com.github.javaparser.serialization.JavaParserJsonSerializer;

import javax.json.Json;
import javax.json.stream.JsonGenerator;
import javax.json.stream.JsonGeneratorFactory;
import java.io.StringWriter;
import java.util.HashMap;
import java.util.Map;

public class TreeHelper {
    public static String nodeToJson(Node n) {
        Map<String, Object> config = new HashMap<>();
        return translateNode(n, config);
    }
    public static String nodeToPrettyJson(Node n) {
        Map<String, Object> config = new HashMap<>();
        config.put(JsonGenerator.PRETTY_PRINTING, true);
        return translateNode(n, config);
    }
    private static String translateNode(Node n, Map<String, Object> config) {
        JsonGeneratorFactory factory = Json.createGeneratorFactory(config);
        JavaParserJsonSerializer serializer = new ASTSerializer();
        StringWriter jsonWriter = new StringWriter();
        try(JsonGenerator generator = factory.createGenerator(jsonWriter)) {
            serializer.serialize(n, generator);
        }
        String result = jsonWriter.toString();
        return result;
    }
}
