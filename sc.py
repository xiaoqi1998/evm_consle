import os

def batch_rename_images(folder_path, prefix="image_", start_index=1):
    """
    folder_path: 图片所在文件夹路径
    prefix: 重命名后的前缀
    start_index: 起始序号
    """
    # 获取文件夹内所有文件
    files = os.listdir(folder_path)
    
    # 过滤出图片文件（可以根据需要添加更多格式）
    valid_extensions = ('.jpg', '.jpeg', '.png', '.bmp', '.gif')
    images = [f for f in files if f.lower().endswith(valid_extensions)]
    
    # 排序以保证重命名顺序一致（可选）
    images.sort()

    count = start_index
    for filename in images:
        # 获取原文件的扩展名
        file_ext = os.path.splitext(filename)[1]
        
        # 构造新名称，例如：image_001.jpg
        # {:03d} 表示数字占3位，不足补0，例如 1 -> 001
        new_name = f"{prefix}{count:03d}{file_ext}"
        
        # 构建完整路径
        src = os.path.join(folder_path, filename)
        dst = os.path.join(folder_path, new_name)
        
        # 执行重命名
        os.rename(src, dst)
        print(f"重命名: {filename} -> {new_name}")
        
        count += 1

    print(f"\n处理完成！共处理了 {count - start_index} 张图片。")

# --- 使用示例 ---
# 请将下面的路径修改为你的图片文件夹路径
folder_path = r'C:\Users\SNQU-0245\Downloads\1000张图\1000张图' 
batch_rename_images(folder_path, prefix="", start_index=1)