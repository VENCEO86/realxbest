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
    
    print("\n🚀 Render 환경 변수 자동 설정 시작...\n")
    
    success_count = 0
    fail_count = 0
    
    for key, value in ENV_VARS.items():
        try:
            payload = {
                "key": key,
                "value": value
            }
            
            print(f"  시도: {key}...", end=" ")
            
            response = requests.post(url, json=payload, headers=headers)
            
            if response.status_code == 201:
                print("✅ 성공!")
                success_count += 1
            elif response.status_code == 409:
                print("ℹ️  이미 존재함 (업데이트 시도)...", end=" ")
                # 업데이트 시도
                update_url = f"{url}/{key}"
                update_response = requests.put(update_url, json={"value": value}, headers=headers)
                if update_response.status_code == 200:
                    print("✅ 업데이트 완료!")
                    success_count += 1
                else:
                    print(f"⚠️  업데이트 실패 (HTTP {update_response.status_code})")
                    fail_count += 1
            else:
                print(f"❌ 실패 (HTTP {response.status_code})")
                if response.text:
                    print(f"     오류: {response.text[:100]}")
                fail_count += 1
                
        except Exception as e:
            print(f"❌ 오류: {str(e)}")
            fail_count += 1
    
    print(f"\n📊 결과: {success_count}개 성공, {fail_count}개 실패\n")
    
    if fail_count > 0:
        print("⚠️  일부 변수 설정에 실패했습니다.")
        print("   Render 대시보드에서 수동으로 설정해주세요.\n")
        return False
    else:
        print("✅ 모든 환경 변수 설정 완료!\n")
        return True

if __name__ == "__main__":
    try:
        success = setup_env_vars()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⚠️  사용자에 의해 중단되었습니다.\n")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ 예상치 못한 오류: {str(e)}\n")
        sys.exit(1)

