from app.models.best_sellers import BestSellersModel


def save_asin(data):
    return BestSellersModel.save_asin(data)
