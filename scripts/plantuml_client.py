import os
import sys
import json
import subprocess
import time

def get_plantuml_mcp_env():
    env = os.environ.copy()
    env['PLANTUML_SERVER_URL'] = 'https://www.plantuml.com/plantuml'
    env['PLANTUML_ALLOWED_DIRS'] = '*'
    return env

def render_plantuml(puml_code_or_file, output_path, format='png', timeout=30):
    if os.path.exists(puml_code_or_file):
        with open(puml_code_or_file, 'r', encoding='utf-8') as f:
            code = f.read()
    else:
        code = puml_code_or_file

    env = get_plantuml_mcp_env()
    proc = subprocess.Popen(
        ['cmd.exe', '/c', 'npx', '-y', 'plantuml-mcp-server'],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        encoding='utf-8',
        env=env
    )

    try:
        # Initialize
        init_req = {
            'jsonrpc': '2.0',
            'id': 1,
            'method': 'initialize',
            'params': {
                'protocolVersion': '2024-11-05',
                'capabilities': {},
                'clientInfo': {'name': 'EnglishHubPlantUML', 'version': '1.0'}
            }
        }
        proc.stdin.write(json.dumps(init_req) + '\n')
        proc.stdin.flush()
        proc.stdout.readline()

        # Tools Call
        call_req = {
            'jsonrpc': '2.0',
            'id': 2,
            'method': 'tools/call',
            'params': {
                'name': 'generate_plantuml_diagram',
                'arguments': {
                    'plantuml_code': code,
                    'format': format,
                    'output_path': os.path.abspath(output_path)
                }
            }
        }
        proc.stdin.write(json.dumps(call_req) + '\n')
        proc.stdin.flush()
        raw_resp = proc.stdout.readline()
        
        resp = json.loads(raw_resp)
        result = resp.get('result', {})
        content = result.get('content', [{}])[0].get('text', '')
        if 'error' in content.lower() and 'security error' in content.lower():
            raise RuntimeError(f"PlantUML MCP Error: {content}")
        return True, content
    finally:
        proc.kill()

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: python plantuml_client.py <input.puml> <output.png/svg>")
        sys.exit(1)
    success, msg = render_plantuml(sys.argv[1], sys.argv[2])
    print("Render success:", success)
    print("Output:", msg)
