import requests

def test_api():
    base_url = "http://localhost:8000"
    
    # 1. Test Registration
    print("Testing Registration...")
    reg_data = {
        "username": "testuser",
        "password": "testpassword",
        "age": 70
    }
    try:
        response = requests.post(f"{base_url}/register", json=reg_data)
        print(f"Registration Status: {response.status_code}")
        res_json = response.json()
        if "traceback" in res_json:
            print("BACKEND TRACEBACK:")
            print(res_json["traceback"])
        else:
            print(f"Registration Response: {res_json}")
    except Exception as e:
        print(f"Registration failed: {e}")

    # 2. Test Login
    print("\nTesting Login...")
    login_data = {
        "username": "testuser",
        "password": "testpassword"
    }
    try:
        # FastAPI expects x-www-form-urlencoded
        response = requests.post(f"{base_url}/login", data=login_data)
        print(f"Login Status: {response.status_code}")
        print(f"Login Response: {response.json()}")
    except Exception as e:
        print(f"Login failed: {e}")

if __name__ == "__main__":
    test_api()
