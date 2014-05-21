<tr>
    <td>{{ patient_number }}</td>
    {% for x in ab.sir_results %}
        <td title={{loop.key}}>{{x}}</td>
    {% endfor %}
</tr>
