import json
import os

log_path = '/home/elmardi/.gemini/antigravity/brain/0a1ee57d-1e1f-4df0-9671-437d1ab3578e/.system_generated/logs/overview.txt'
output_dir = '/home/elmardi/Documents/Web3/thewhatofsoneium/scratch/recovered'
os.makedirs(output_dir, exist_ok=True)

with open(log_path, 'r') as f:
    for i, line in enumerate(f, 1):
        try:
            data = json.loads(line)
            if 'tool_calls' in data:
                for call in data['tool_calls']:
                    name = call['name']
                    args = call['args']
                    
                    target = None
                    content = None
                    
                    if name == 'write_to_file':
                        target = args.get('TargetFile', '').strip('"')
                        content = args.get('CodeContent', '')
                    elif name in ['replace_file_content', 'multi_replace_file_content']:
                        # We might need these to get the final version if write_to_file was early
                        pass
                    
                    if target and content:
                        # Clean target path for filename
                        clean_name = target.replace('/', '_').strip('_')
                        with open(os.path.join(output_dir, f"{i}_{clean_name}"), 'w') as out:
                            out.write(content)
        except Exception as e:
            # print(f"Error on line {i}: {e}")
            pass
