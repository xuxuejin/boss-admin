from ..extensions import db
from .base import BaseModelMixin


class BestSellersModel(BaseModelMixin):
    """
        best_sellers_mattress 表模型
    """
    __tablename__ = 'best_sellers_mattress'
    asin = db.Column(db.String(20), unique=True, index=True, comment='亚马逊ASIN码')
    title = db.Column(db.String(500), nullable=False, comment='产品名称')
    review = db.Column(db.Integer, nullable=False, default=0, comment='评论数量')
    model = db.Column(db.String(50), nullable=True, comment='产品厚度/型号')
    size = db.Column(db.String(50), nullable=True, comment='产品尺寸')
    main_category_name = db.Column(db.String(50), comment='所属大类目')
    main_category_rank = db.Column(db.Integer, nullable=True, comment='大类目排名')
    sub_category_name = db.Column(db.String(50), comment='所属细分类目')
    sub_category_rank = db.Column(db.Integer, nullable=True, comment='细分小类目排名')
    price = db.Column(db.Numeric(10, 2), comment='产品单价')

    def __init__(self, **kwargs):
        super(BestSellersModel, self).__init__(**kwargs)

    def __repr__(self):
        return f'<BestSellersModel {self.title[:20]}...>'

    @classmethod
    def save_asin(cls, data):
        try:
            exists = db.session.query(cls).filter_by(asin=data["asin"]).first()
            if exists:
                return exists, False
            product = cls(**data)
            db.session.add(product)
            db.session.commit()
            return product, True
        except Exception:
            db.session.rollback()
            raise
