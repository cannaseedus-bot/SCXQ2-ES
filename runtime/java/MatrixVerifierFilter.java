import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.*;
import java.util.stream.Collectors;

/**
 * MATRIX verify (Java projection)
 * This is a shell: it must call the verifier (native port later).
 */
public class MatrixVerifierFilter implements Filter {

  private final String expectedAbi;
  private final File policyFile;

  public MatrixVerifierFilter(String expectedAbi, File policyFile) {
    this.expectedAbi = expectedAbi;
    this.policyFile = policyFile;
  }

  @Override
  public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
    throws IOException, ServletException {

    HttpServletRequest req = (HttpServletRequest) request;
    HttpServletResponse res = (HttpServletResponse) response;

    String body = req.getReader().lines().collect(Collectors.joining("\n"));
    if (body == null || body.isEmpty()) {
      res.sendError(400, "PROGRAM_REQUIRED");
      return;
    }

    File programFile = File.createTempFile("mx_prog_", ".json");
    try (FileWriter w = new FileWriter(programFile)) { w.write(body); }

    ProcessBuilder pb = new ProcessBuilder(
      "matrix-verify",
      "--program", programFile.getAbsolutePath(),
      "--policy", policyFile.getAbsolutePath(),
      "--expect", expectedAbi,
      "--plugins", "idb,kql",
      "--quiet"
    );

    pb.redirectErrorStream(true);
    Process p = pb.start();
    String out;
    try (BufferedReader br = new BufferedReader(new InputStreamReader(p.getInputStream()))) {
      out = br.lines().collect(Collectors.joining("\n"));
    }

    int code;
    try { code = p.waitFor(); } catch (InterruptedException e) { code = 1; }

    programFile.delete();

    if (code != 0) {
      res.setStatus(403);
      res.setContentType("application/json");
      res.getWriter().write("{\"error\":\"ABI_MISMATCH\",\"detail\":" + quote(out) + "}");
      return;
    }

    chain.doFilter(request, response);
  }

  private static String quote(String s) {
    return "\"" + s.replace("\\", "\\\\").replace("\"", "\\\"") + "\"";
  }
}
