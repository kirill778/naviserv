from passlib.context import CryptContext

# Создаем контекст для хеширования паролей с использованием bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    """Проверяет совпадение пароля с хешем"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    """Получает хеш для пароля"""
    return pwd_context.hash(password) 