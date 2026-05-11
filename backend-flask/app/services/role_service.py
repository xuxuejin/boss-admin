from flask_babel import gettext as _

from app.repositories import role as role_repo


def list_roles():
    roles = role_repo.list_all()
    return {
        'data': [role.to_dict() for role in roles],
        'message': _('Roles fetched successfully'),
    }
