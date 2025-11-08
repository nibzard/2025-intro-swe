class Student:
    def __init__(self, name, year):
        self.name = name
        self.year = year

    def greet(self):
        print(f"Hello! I'm {self.name}, a {self.year} student.")


# Example usage
if __name__ == "__main__":
    student = Student("Alex", "sophomore")
    student.greet()
