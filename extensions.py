from flask_sqlalchemy import SQLAlchemy

# 初始化数据库对象
# 注意：这里不传入app，而是在app.py中使用init_app初始化
db = SQLAlchemy()
