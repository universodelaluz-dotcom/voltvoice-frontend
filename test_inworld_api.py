#!/usr/bin/env python3
import requests
import json
import base64
from pathlib import Path

url = "https://api.inworld.ai/tts/v1/voice:stream"

headers = {
    "Authorization": "Basic MnQ4UEtPS0RiR3hpTVREZmJBcUViZXhtYnppTWxUVEM6cmFrdWFNSzFGM3RlVXNrQ2FIc21aa0N2bXdYZm0zOVlXS3l6UFpkVDkwc2x1MEdtR0J4eHZncVdOZ0o4eE4zMQ==",
    "Content-Type": "application/json"
}

# Try with documented format (snake_case + audio_config)
payload = {
    "text": "Prueba de audio para diagnóstico",
    "voice_id": "default-cfjnp8x4nt-owd7yg-1xsw__garret",
    "audio_config": {
        "audio_encoding": "MP3",
        "speaking_rate": 1
    },
    "temperature": 1,
    "model_id": "inworld-tts-1.5-max"
}

print("[TEST 1] Enviando con audio_config (formato documentado)...")
print(f"Payload: {json.dumps(payload, indent=2)}\n")

try:
    response = requests.post(url, json=payload, headers=headers, stream=True)
    response.raise_for_status()

    # Collect full response
    full_data = b""
    for chunk in response.iter_content(chunk_size=8192):
        if chunk:
            full_data += chunk

    # Parse JSON
    response_text = full_data.decode('utf-8')
    print(f"Response size: {len(response_text)} bytes")
    print(f"Response preview: {response_text[:500]}\n")

    # Try to extract audioContent
    data = json.loads(response_text)
    if 'result' in data and 'audioContent' in data['result']:
        audio_content = data['result']['audioContent']
        print(f"✅ audioContent found: {len(audio_content)} base64 chars")

        # Check base64 padding
        if audio_content.endswith('=') or audio_content.endswith('=='):
            print(f"✅ Base64 has proper padding")
        else:
            print(f"⚠️  Base64 missing padding!")

        # Decode and save
        try:
            audio_bytes = base64.b64decode(audio_content)
            print(f"✅ Decoded: {len(audio_bytes)} bytes")

            # Check MP3 headers
            if audio_bytes[0] == 0xFF and (audio_bytes[1] == 0xFB or audio_bytes[1] == 0xFA):
                print(f"✅ Valid MP3 headers detected")
                first_20 = audio_bytes[:20].hex()
                last_20 = audio_bytes[-20:].hex()
                print(f"   First 20 bytes: {first_20}")
                print(f"   Last 20 bytes:  {last_20}")
            else:
                print(f"⚠️  No MP3 headers (first bytes: {audio_bytes[0]:02x} {audio_bytes[1]:02x})")

            # Save file for manual testing
            output_path = Path("test_inworld_api.mp3")
            with open(output_path, 'wb') as f:
                f.write(audio_bytes)
            print(f"\n✅ Saved to: {output_path}")

        except Exception as e:
            print(f"❌ Failed to decode: {e}")
    else:
        print("❌ No audioContent in response")

except Exception as e:
    print(f"❌ API Error: {e}")
    print(f"Response: {response.text if hasattr(response, 'text') else 'N/A'}")
