import json
import re

log_path = '/home/elmardi/.gemini/antigravity/brain/0a1ee57d-1e1f-4df0-9671-437d1ab3578e/.system_generated/logs/overview.txt'
recovered_files = {}

with open(log_path, 'r') as f:
    for line in f:
        try:
            data = json.loads(line)
            if 'tool_calls' in data:
                for call in data['tool_calls']:
                    name = call['name']
                    args = call['args']
                    
                    if name == 'write_to_file':
                        target = args.get('TargetFile', '').strip('"')
                        content = args.get('CodeContent', '').strip('"')
                        if target and content:
                            recovered_files[target] = content
                    
                    elif name == 'replace_file_content' or name == 'multi_replace_file_content':
                        # These are harder because we need the base content.
                        # But maybe the last write_to_file is enough for some, 
                        # or we can find the full content in a view_file call.
                        pass
        except Exception as e:
            pass

# Since we might have truncated strings in the logs if they were captured that way,
# let's see what we got.
for path, content in recovered_files.items():
    # Unescape the content
    # content = content.encode().decode('unicode_escape') 
    # The logs might have literal \n etc.
    print(f"Recovered {path}: {len(content)} bytes")
    # Save it
    filename = path.split('/')[-1]
    with open(f'/home/elmardi/Documents/Web3/thewhatofsoneium/scratch/recovered_{filename}', 'w') as f:
        f.write(content)
