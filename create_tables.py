from app import app, db
from models import FeedbackLog

with app.app_context():
    db.create_all()
    print("数据库表创建成功！")