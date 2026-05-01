import os
import sys
from asgiref.wsgi import AsgiToWsgi

# Add backend_api to Python path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from main import app

application = AsgiToWsgi(app)
