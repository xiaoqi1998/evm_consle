# 1. 指定使用 Python 环境
FROM python:3.12-slim

# 2. 在容器里创建一个放代码的文件夹叫 /code
WORKDIR /code

# 3. 把你本地的依赖清单复制进容器
COPY requirements.txt .

# 4. 在容器里安装依赖 (同时安装 gunicorn)
# 加上 -i 参数指向国内镜像源
RUN pip install --no-cache-dir -i https://mirrors.aliyun.com/pypi/simple/ \
    -r requirements.txt gunicorn

# 5. 把你本地的代码复制进容器
COPY . .

# 6. 告诉 Docker：启动时运行 gunicorn (替换掉原来的 CMD)
# -w 4: 开启 4 个工作进程
# -b 0.0.0.0:5000: 绑定到 0.0.0.0 和 5000 端口
# app:app : 前面的 app 指文件名 app.py，后面的 app 指代码里定义的 flask 实例名
CMD ["gunicorn", "-w", "2", "-b", "0.0.0.0:5000", "app:app"]