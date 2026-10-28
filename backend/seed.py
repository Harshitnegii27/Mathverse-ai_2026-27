from database import SessionLocal, engine, Base
import models

# Ensure tables are created
Base.metadata.create_all(bind=engine)

db = SessionLocal()

# Check if users exist
if not db.query(models.User).first():
    user = models.User(name="Peter Parker", role="student", points=0, level=1)
    db.add(user)
    db.commit()

# Check if missions exist
if not db.query(models.Mission).first():
    missions = [
        models.Mission(missionId="mission_001_algebra", topic="solving linear equations", difficulty=1),
        models.Mission(missionId="mission_002_geometry", topic="calculating area of triangles", difficulty=2),
    ]
    db.add_all(missions)
    db.commit()

print("Database seeded successfully!")
db.close()
