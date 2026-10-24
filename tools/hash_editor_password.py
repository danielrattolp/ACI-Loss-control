"""Generate a dedicated CMS admin password hash without echoing the password."""
import getpass
from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from editorial.service import password_hash

if __name__ == '__main__':
    password=getpass.getpass('Contraseña del administrador editorial (mínimo 14 caracteres): ')
    confirmation=getpass.getpass('Repetir contraseña: ')
    if password != confirmation:
        sys.exit('Las contraseñas no coinciden.')
    print(password_hash(password))
