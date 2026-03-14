#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Mental Health Tracking App
Tests all mood, gratitude, and routine API endpoints.
"""

import requests
import json
from datetime import datetime
import time
import sys

# Backend URL from environment
BACKEND_URL = "https://bipolar-wellness-hub.preview.emergentagent.com/api"
USER = "default_user"

# Test data
MOOD_TYPES = ["Manic", "Hypomanic", "Very Happy", "Pleasant", "Normal", "Sad", "Depressed", "Extremely Depressed"]
SYMPTOM_DATA = {
    "racing_thoughts": True,
    "no_sleep": True,
    "over_interest": True,
    "lack_control": False,
    "anxiety": True,
    "ordering": False,
    "over_planning": True,
    "self_harm": False,
    "angry": True,
    "depressed_anxiety": True
}

GRATITUDE_ENTRIES = [
    {"title": "Morning Sunshine", "description": "Grateful for the beautiful sunrise that brightened my day and filled me with hope."},
    {"title": "Supportive Family", "description": "My family has been incredibly understanding and supportive during my challenging times."},
    {"title": "Good Therapy Session", "description": "Had a breakthrough in therapy today that helped me understand my patterns better."}
]

ROUTINE_TASKS = [
    "Take morning medication",
    "Practice deep breathing exercises", 
    "Go for a 20-minute walk",
    "Write in journal",
    "Prepare healthy meals",
    "Get 8 hours of sleep",
    "Practice mindfulness meditation"
]

class BackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = {
            "total_tests": 0,
            "passed": 0,
            "failed": 0,
            "errors": []
        }
        self.created_mood_ids = []
        self.created_gratitude_ids = []
        self.created_task_ids = []
        self.created_score_ids = []

    def log_test(self, test_name, success, details=""):
        self.test_results["total_tests"] += 1
        if success:
            self.test_results["passed"] += 1
            print(f"✅ {test_name}")
        else:
            self.test_results["failed"] += 1
            error_msg = f"❌ {test_name}: {details}"
            print(error_msg)
            self.test_results["errors"].append(error_msg)

    def test_mood_endpoints(self):
        print("\n🧠 TESTING MOOD ENDPOINTS")
        print("="*50)
        
        # Test 1: Create mood entries
        for mood in MOOD_TYPES[:3]:  # Test first 3 moods
            try:
                payload = {"mood": mood, "user": USER}
                response = self.session.post(f"{BACKEND_URL}/moods", json=payload)
                
                if response.status_code == 200:
                    data = response.json()
                    if "id" in data and data["mood"] == mood and data["user"] == USER:
                        self.created_mood_ids.append(data["id"])
                        self.log_test(f"Create mood entry ({mood})", True)
                    else:
                        self.log_test(f"Create mood entry ({mood})", False, "Invalid response format")
                else:
                    self.log_test(f"Create mood entry ({mood})", False, f"Status: {response.status_code}, Response: {response.text}")
            except Exception as e:
                self.log_test(f"Create mood entry ({mood})", False, str(e))

        # Test 2: Update mood with symptoms
        if self.created_mood_ids:
            try:
                mood_id = self.created_mood_ids[0]
                response = self.session.put(f"{BACKEND_URL}/moods/{mood_id}", json=SYMPTOM_DATA)
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("status") == "success":
                        self.log_test("Update mood with symptoms", True)
                    else:
                        self.log_test("Update mood with symptoms", False, "No success status")
                else:
                    self.log_test("Update mood with symptoms", False, f"Status: {response.status_code}, Response: {response.text}")
            except Exception as e:
                self.log_test("Update mood with symptoms", False, str(e))
        else:
            self.log_test("Update mood with symptoms", False, "No mood IDs to update")

        # Test 3: Get mood entries (test sorting)
        try:
            response = self.session.get(f"{BACKEND_URL}/moods", params={"user": USER})
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) >= len(self.created_mood_ids):
                    # Check if sorted by date descending
                    dates = [datetime.fromisoformat(entry["date"].replace('Z', '+00:00')) for entry in data]
                    is_sorted = all(dates[i] >= dates[i+1] for i in range(len(dates)-1))
                    
                    # Check ObjectId conversion
                    has_string_ids = all(isinstance(entry.get("id"), str) for entry in data)
                    
                    if is_sorted and has_string_ids:
                        self.log_test("Get mood entries (sorting & ObjectId conversion)", True)
                    else:
                        self.log_test("Get mood entries", False, f"Sorting: {is_sorted}, String IDs: {has_string_ids}")
                else:
                    self.log_test("Get mood entries", False, f"Expected list with {len(self.created_mood_ids)} entries, got: {type(data)}")
            else:
                self.log_test("Get mood entries", False, f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_test("Get mood entries", False, str(e))

    def test_gratitude_endpoints(self):
        print("\n💝 TESTING GRATITUDE ENDPOINTS")
        print("="*50)
        
        # Test 1: Create gratitude entries
        for entry in GRATITUDE_ENTRIES:
            try:
                payload = {**entry, "user": USER}
                response = self.session.post(f"{BACKEND_URL}/gratitude", json=payload)
                
                if response.status_code == 200:
                    data = response.json()
                    if "id" in data and data["title"] == entry["title"] and data["user"] == USER:
                        self.created_gratitude_ids.append(data["id"])
                        self.log_test(f"Create gratitude entry ({entry['title']})", True)
                    else:
                        self.log_test(f"Create gratitude entry ({entry['title']})", False, "Invalid response format")
                else:
                    self.log_test(f"Create gratitude entry ({entry['title']})", False, f"Status: {response.status_code}, Response: {response.text}")
            except Exception as e:
                self.log_test(f"Create gratitude entry ({entry['title']})", False, str(e))

        # Test 2: Get gratitude entries (test sorting)
        try:
            response = self.session.get(f"{BACKEND_URL}/gratitude", params={"user": USER})
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) >= len(self.created_gratitude_ids):
                    # Check if sorted by date descending
                    dates = [datetime.fromisoformat(entry["date"].replace('Z', '+00:00')) for entry in data]
                    is_sorted = all(dates[i] >= dates[i+1] for i in range(len(dates)-1))
                    
                    # Check ObjectId conversion
                    has_string_ids = all(isinstance(entry.get("id"), str) for entry in data)
                    
                    if is_sorted and has_string_ids:
                        self.log_test("Get gratitude entries (sorting & ObjectId conversion)", True)
                    else:
                        self.log_test("Get gratitude entries", False, f"Sorting: {is_sorted}, String IDs: {has_string_ids}")
                else:
                    self.log_test("Get gratitude entries", False, f"Expected list with {len(self.created_gratitude_ids)} entries, got: {type(data)}")
            else:
                self.log_test("Get gratitude entries", False, f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_test("Get gratitude entries", False, str(e))

    def test_routine_endpoints(self):
        print("\n📋 TESTING ROUTINE ENDPOINTS")
        print("="*50)
        
        # Test 1: Create routine tasks
        for task_name in ROUTINE_TASKS[:4]:  # Test first 4 tasks
            try:
                payload = {"taskName": task_name, "user": USER}
                response = self.session.post(f"{BACKEND_URL}/routine/tasks", json=payload)
                
                if response.status_code == 200:
                    data = response.json()
                    if "id" in data and data["taskName"] == task_name and data["points"] == 10:
                        self.created_task_ids.append(data["id"])
                        self.log_test(f"Create routine task ({task_name[:20]}...)", True)
                    else:
                        self.log_test(f"Create routine task ({task_name[:20]}...)", False, "Invalid response format")
                else:
                    self.log_test(f"Create routine task ({task_name[:20]}...)", False, f"Status: {response.status_code}, Response: {response.text}")
            except Exception as e:
                self.log_test(f"Create routine task ({task_name[:20]}...)", False, str(e))

        # Test 2: Get routine tasks
        try:
            response = self.session.get(f"{BACKEND_URL}/routine/tasks", params={"user": USER})
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) >= len(self.created_task_ids):
                    # Check ObjectId conversion and points
                    has_string_ids = all(isinstance(task.get("id"), str) for task in data)
                    correct_points = all(task.get("points") == 10 for task in data)
                    
                    if has_string_ids and correct_points:
                        self.log_test("Get routine tasks (ObjectId conversion & points)", True)
                    else:
                        self.log_test("Get routine tasks", False, f"String IDs: {has_string_ids}, Correct points: {correct_points}")
                else:
                    self.log_test("Get routine tasks", False, f"Expected list with {len(self.created_task_ids)} entries, got: {type(data)}")
            else:
                self.log_test("Get routine tasks", False, f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_test("Get routine tasks", False, str(e))

    def test_routine_score_endpoints(self):
        print("\n📊 TESTING ROUTINE SCORE ENDPOINTS")
        print("="*50)
        
        # Test 1: Create daily routine scores
        test_scores = [30, 50, 70]  # Different score values
        
        for score in test_scores:
            try:
                payload = {"total_points": score, "user": USER}
                response = self.session.post(f"{BACKEND_URL}/routine/scores", json=payload)
                
                if response.status_code == 200:
                    data = response.json()
                    if "id" in data and data["total_points"] == score and data["user"] == USER:
                        self.created_score_ids.append(data["id"])
                        self.log_test(f"Create daily score ({score} points)", True)
                    else:
                        self.log_test(f"Create daily score ({score} points)", False, "Invalid response format")
                else:
                    self.log_test(f"Create daily score ({score} points)", False, f"Status: {response.status_code}, Response: {response.text}")
            except Exception as e:
                self.log_test(f"Create daily score ({score} points)", False, str(e))
            
            time.sleep(0.1)  # Small delay to ensure different timestamps

        # Test 2: Get daily scores (test sorting)
        try:
            response = self.session.get(f"{BACKEND_URL}/routine/scores", params={"user": USER})
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) >= len(self.created_score_ids):
                    # Check if sorted by score_date descending
                    dates = [datetime.fromisoformat(entry["score_date"].replace('Z', '+00:00')) for entry in data]
                    is_sorted = all(dates[i] >= dates[i+1] for i in range(len(dates)-1))
                    
                    # Check ObjectId conversion
                    has_string_ids = all(isinstance(entry.get("id"), str) for entry in data)
                    
                    if is_sorted and has_string_ids:
                        self.log_test("Get daily scores (sorting & ObjectId conversion)", True)
                    else:
                        self.log_test("Get daily scores", False, f"Sorting: {is_sorted}, String IDs: {has_string_ids}")
                else:
                    self.log_test("Get daily scores", False, f"Expected list with {len(self.created_score_ids)} entries, got: {type(data)}")
            else:
                self.log_test("Get daily scores", False, f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_test("Get daily scores", False, str(e))

    def test_backend_health(self):
        print("\n🏥 TESTING BACKEND HEALTH")
        print("="*50)
        
        try:
            # Basic connectivity test
            response = self.session.get(f"{BACKEND_URL}/moods", params={"user": "health_check"})
            
            if response.status_code in [200, 404]:  # 200 or 404 means backend is responding
                self.log_test("Backend connectivity", True)
            else:
                self.log_test("Backend connectivity", False, f"Unexpected status: {response.status_code}")
        except Exception as e:
            self.log_test("Backend connectivity", False, str(e))

    def run_all_tests(self):
        print("🚀 Starting Backend API Tests for Mental Health Tracking App")
        print(f"Backend URL: {BACKEND_URL}")
        print(f"User: {USER}")
        print("\n")
        
        self.test_backend_health()
        self.test_mood_endpoints()
        self.test_gratitude_endpoints()
        self.test_routine_endpoints()
        self.test_routine_score_endpoints()
        
        # Print summary
        print("\n" + "="*60)
        print("🏁 TEST SUMMARY")
        print("="*60)
        print(f"Total Tests: {self.test_results['total_tests']}")
        print(f"Passed: {self.test_results['passed']} ✅")
        print(f"Failed: {self.test_results['failed']} ❌")
        
        if self.test_results['errors']:
            print(f"\n🚨 FAILED TESTS:")
            for error in self.test_results['errors']:
                print(f"  {error}")
        
        success_rate = (self.test_results['passed'] / self.test_results['total_tests']) * 100 if self.test_results['total_tests'] > 0 else 0
        print(f"\nSuccess Rate: {success_rate:.1f}%")
        
        return self.test_results

if __name__ == "__main__":
    tester = BackendTester()
    results = tester.run_all_tests()
    
    # Exit with appropriate code
    sys.exit(0 if results['failed'] == 0 else 1)