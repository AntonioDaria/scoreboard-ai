import os
import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.db.database import Base
from app.tests.seeders.seed_users import seed_users
from app.tests.seeders.seed_fixtures import seed_fixtures
from app.tests.seeders.seed_predictions import seed_predictions
from app.tests.seeders.seed_slips import seed_slips

TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/football_predictions_test",
)

engine = create_engine(TEST_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db():
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    seed_users(session)
    seed_fixtures(session)
    seed_predictions(session)
    seed_slips(session)

    yield session

    session.close()
    transaction.rollback()
    connection.close()
