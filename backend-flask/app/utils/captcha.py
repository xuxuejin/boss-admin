import base64
import uuid
import io
import random
import string
from PIL import Image, ImageDraw, ImageFont


class Captcha:
    def __init__(self, store, key_prefix='captcha:', expire=60):
        """
        初始化 Captcha 实例。
        """
        self.width = 120
        self.height = 40
        self.code_length = 4
        self.key_prefix = key_prefix
        self.expire = expire
        self.store = store

    def _generate_random_code(self):
        """生成随机验证码字符串（大写字母 + 数字）"""
        characters = string.ascii_uppercase + string.digits
        return ''.join(random.choices(characters, k=self.code_length))

    def _add_noise(self, draw):
        """添加噪点和干扰线"""
        for _ in range(200):
            x = random.randint(0, self.width)
            y = random.randint(0, self.height)
            draw.point((x, y), fill=(random.randint(100, 200),
                                     random.randint(100, 200),
                                     random.randint(100, 200)))
        for _ in range(4):
            start = (random.randint(0, self.width), random.randint(0, self.height))
            end = (random.randint(0, self.width), random.randint(0, self.height))
            draw.line([start, end], fill=(random.randint(100, 200),
                                          random.randint(100, 200),
                                          random.randint(100, 200)), width=2)

    def _create_captcha_image(self, code):
        """
        根据验证码文本生成 PIL Image 对象
        """
        image = Image.new("RGB", (self.width, self.height), (255, 255, 255))
        draw = ImageDraw.Draw(image)

        # 计算每个字符的平均宽度
        font_size = int(self.height * random.uniform(0.7, 0.8))
        font = ImageFont.load_default().font_variant(size=font_size)  # 通过 font_variant 设置验证码字体大小

        avg_width = self.width // self.code_length

        for i, char in enumerate(code):
            x = i * avg_width + random.randint(0, avg_width // 4)
            y = random.randint(0, self.height - font_size)
            draw.text((x, y), char, font=font, fill=(0, 0, 0))

        self._add_noise(draw)
        return image

    def generate_captcha_base64(self):
        """生成验证码图片并返回 base64 字符串和 code 和 captcha_id """
        captcha_id = uuid.uuid4().hex
        code = self._generate_random_code()

        self.store.setex(f'{self.key_prefix}{captcha_id}', self.expire, code)

        image = self._create_captcha_image(code)

        # 转换为 base64
        image_io = io.BytesIO()
        image.save(image_io, format="PNG")
        image_io.seek(0)
        base64_data = base64.b64encode(image_io.read()).decode("utf-8")

        return captcha_id, base64_data

    def verify_captcha(self, captcha_id, user_code):
        stored_code = self.store.get(f'{self.key_prefix}{captcha_id}')

        if not stored_code:
            return False

        # 删掉验证码
        self.store.delete(f'{self.key_prefix}{captcha_id}')

        return stored_code.upper() == user_code.upper()
