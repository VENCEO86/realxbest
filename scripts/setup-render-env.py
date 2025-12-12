#!/usr/bin/env python3
"""
Render 환경 변수 자동 설정 스크립트
사용법: python scripts/setup-render-env.py
"""

import requests
import json
import sys

# Render API 설정
API_KEY = "rnd_xBMRmYRPVbVLazlTIsSOoaOUuWgb"
SERVICE_ID = "srv-d48p38jipnbc73dkh990"
BASE_URL = "https://api.render.com/v1"

# 설정할 환경 변수들
ENV_VARS = {
    "YOUTUBE_API_KEY": "AIzaSyAQdvDGLrVzHYWz5XNKPEYCvWWJi5ZEnAY",
    "NEXT_PUBLIC_BASE_URL": "https://realxbest.onrender.com",
    "NODE_ENV": "production"
}

def setup_env_vars():
    """환경 변수 설정"""
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Accept": "application/json",
        "Content-Type": "application/json"
    }
    
    url = f"{BASE_URL}/services/{SERVICE_ID}/env-vars"
    
    print("\n[START] Render environment variables auto-setup...\n")
    
    success_count = 0
    fail_count = 0
    
    for key, value in ENV_VARS.items():
        try:
            payload = {
                "key": key,
                "value": value
            }
            
            print(f"  Trying: {key}...", end=" ")
            
            response = requests.post(url, json=payload, headers=headers)
            
            if response.status_code == 201:
                print("[SUCCESS]")
                success_count += 1
            elif response.status_code == 409:
                print("[EXISTS] Updating...", end=" ")
                # 업데이트 시도
                update_url = f"{url}/{key}"
                update_response = requests.put(update_url, json={"value": value}, headers=headers)
                if update_response.status_code == 200:
                    print("[UPDATED]")
                    success_count += 1
                else:
                    print(f"[FAIL] HTTP {update_response.status_code}")
                    fail_count += 1
            else:
                print(f"[FAIL] HTTP {response.status_code}")
                if response.text:
                    print(f"     Error: {response.text[:100]}")
                fail_count += 1
                
        except Exception as e:
            print(f"[ERROR] {str(e)}")
            fail_count += 1
    
    print(f"\n[RESULT] {success_count} success, {fail_count} failed\n")
    
    if fail_count > 0:
        print("[WARNING] Some variables failed to set.")
        print("   Please set them manually in Render dashboard.\n")
        return False
    else:
        print("[SUCCESS] All environment variables set!\n")
        return True

if __name__ == "__main__":
    try:
        success = setup_env_vars()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n[INTERRUPTED] Stopped by user.\n")
        sys.exit(1)
    except Exception as e:
        print(f"\n[ERROR] Unexpected error: {str(e)}\n")
        sys.exit(1)

