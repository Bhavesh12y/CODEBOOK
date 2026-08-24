import sys
import json
import io
import traceback
import contextlib

globals_dict = {"__name__": "__main__", "__doc__": None}

def main():
    global globals_dict
    for line in sys.stdin:
        if not line.strip():
            continue
        try:
            req = json.loads(line)
        except json.JSONDecodeError:
            continue
            
        action = req.get("action")
        if action == "ping":
            print(json.dumps({"status": "pong"}))
            sys.stdout.flush()
            continue
        elif action == "reset":
            globals_dict = {"__name__": "__main__", "__doc__": None}
            print(json.dumps({"status": "success"}))
            sys.stdout.flush()
            continue
            
        cell_id = req.get("cellId", "unknown")
        code = req.get("code", "")
        stdin_data = req.get("stdin", "")
        
        stdout_buf = io.StringIO()
        stderr_buf = io.StringIO()
        stdin_buf = io.StringIO(stdin_data)
        
        status = "success"
        exit_code = 0
        diagnostics = []
        message = None
        
        try:
            with contextlib.redirect_stdout(stdout_buf), contextlib.redirect_stderr(stderr_buf):
                old_stdin = sys.stdin
                sys.stdin = stdin_buf
                try:
                    code_obj = compile(code, f"<cell-{cell_id}>", "exec")
                    exec(code_obj, globals_dict)
                finally:
                    sys.stdin = old_stdin
        except Exception as e:
            status = "error"
            exit_code = 1
            
            # Extract line number from traceback
            tb = traceback.extract_tb(e.__traceback__)
            line_number = None
            for frame in tb:
                if frame.filename == f"<cell-{cell_id}>":
                    line_number = frame.lineno
                    
            if line_number is None:
                line_number = getattr(e, 'lineno', 1) or 1
                
            msg = f"{type(e).__name__}: {str(e)}"
            diagnostics.append({
                "cellId": cell_id,
                "line": line_number,
                "message": msg,
                "severity": "error"
            })
            
            # print traceback to stderr but strip worker frames
            filtered_tb = []
            for frame in tb:
                if frame.filename.startswith("<cell-"):
                    filtered_tb.append(frame)
            
            if hasattr(traceback, "StackSummary"):
                summary = traceback.StackSummary.from_list(filtered_tb)
                tb_lines = summary.format()
                tb_str = "".join(tb_lines)
            else:
                tb_str = "" # Fallback
            
            error_msg = f"Traceback (most recent call last):\n{tb_str}{type(e).__name__}: {str(e)}\n"
            stderr_buf.write(error_msg)
            
        resp = {
            "status": status,
            "stdout": stdout_buf.getvalue(),
            "stderr": stderr_buf.getvalue(),
            "exitCode": exit_code,
            "diagnostics": diagnostics,
            "message": message
        }
        
        print(json.dumps(resp))
        sys.stdout.flush()

if __name__ == "__main__":
    main()
